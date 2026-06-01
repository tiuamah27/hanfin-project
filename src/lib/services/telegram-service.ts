import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client for backend (bypassing RLS or using anon key)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Hardcoded mapping from Chat ID to Supabase User ID
// Format in env: TELEGRAM_CHAT_MAP='{"123456789": "supabase-uuid-1", "987654321": "supabase-uuid-2"}'
// For simpler setup: TELEGRAM_USER_ID_1=uuid
function getUserIdFromChatId(chatId: string | number): string | null {
  const envMap = process.env.TELEGRAM_CHAT_MAP;
  if (envMap) {
    try {
      const map = JSON.parse(envMap);
      return map[chatId.toString()] || null;
    } catch (e) {
      console.error('Invalid TELEGRAM_CHAT_MAP format');
    }
  }
  
  // Fallback to simpler env vars
  if (chatId.toString() === process.env.TELEGRAM_CHAT_ID_1) return process.env.TELEGRAM_USER_ID_1 || null;
  if (chatId.toString() === process.env.TELEGRAM_CHAT_ID_2) return process.env.TELEGRAM_USER_ID_2 || null;

  return null;
}

export const telegramService = {
  async handleWebhook(body: any) {
    if (!TELEGRAM_BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is not set');

    const message = body.message;
    const callbackQuery = body.callback_query;

    if (message && (message.text || message.photo)) {
      await this.processMessage(message.chat.id, message.from?.id || message.chat.id, message);
    } else if (callbackQuery) {
      await this.processCallbackQuery(
        callbackQuery.message.chat.id, 
        callbackQuery.data, 
        callbackQuery.id, 
        callbackQuery.message.message_id, 
        callbackQuery.message.text || '',
        callbackQuery.from?.id
      );
    }
  },

  async processMessage(chatId: number, senderId: number, messageObj: any) {
    const userId = getUserIdFromChatId(senderId);
    
    if (!userId) {
      await this.sendMessage(chatId, 'Akun Telegram Anda tidak diizinkan menggunakan bot ini.');
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('name').eq('id', userId).single();
    const senderName = profile?.name || 'User';

    const text = messageObj.text || messageObj.caption || '';

    // Handle /lapor or /start commands
    if (text === '/start' || text === '/lapor') {
      const buttons = [
        [{ text: `⬇️ Pemasukan`, callback_data: `cmd_income` }, { text: `⬆️ Pengeluaran`, callback_data: `cmd_expense` }],
        [{ text: `📊 Laporan Keuangan Bulan Ini`, callback_data: `cmd_report` }]
      ];
      await this.sendMessage(chatId, `Halo! 👋\nMau mencatat transaksi atau melihat kondisi keuanganmu hari ini?`, {
        reply_markup: { inline_keyboard: buttons }
      });
      return;
    }

    let isEdit = false;
    let oldData = '';
    if (messageObj?.reply_to_message?.text?.includes('MODE REVISI')) {
      isEdit = true;
      oldData = messageObj.reply_to_message.text;
      
      // Auto-delete the revision chat messages to keep history clean!
      try {
        await this.deleteMessage(chatId, messageObj.reply_to_message.message_id); // delete bot's MODE REVISI prompt
        await this.deleteMessage(chatId, messageObj.message_id); // delete user's reply message
      } catch (e) {
        console.error("Failed to delete revision messages", e);
      }
    }

    // Send loading message and capture its ID
    const loadingMsg = await this.sendMessage(chatId, isEdit ? '⏳ Memproses revisi...' : (messageObj.photo ? '📸 Membaca struk dengan AI...' : '⏳ Sedang memproses pesan...'));
    const loadingMsgId = loadingMsg?.result?.message_id;
    
    try {
      // Fetch Wallets, Categories, and Budget Items
      const { data: wallets, error: wError } = await supabase.from('wallets').select('*').in('wallet_category', ['cash', 'bank', 'ewallet']);
      const { data: categories, error: cError } = await supabase.from('categories').select('*');
      const { data: budgetItems, error: bError } = await supabase.from('budget_items').select('*');

      if (wError) throw new Error("Supabase Wallets Error: " + wError.message);
      if (cError) throw new Error("Supabase Categories Error: " + cError.message);

      // 2. Prepare hierarchical category and budget list for AI
      let categoryTreeText = '';
      if (categories) {
        categoryTreeText = categories.map(c => {
          const relatedBudgets = budgetItems?.filter(b => b.category_id === c.id) || [];
          const budgetNames = relatedBudgets.map(b => b.name).join(', ');
          return `- ${c.name} ${budgetNames ? `(Pilihan Budget: ${budgetNames})` : ''}`;
        }).join('\n');
      }

      // Handle Image if exists
      let imagePart = null;
      if (messageObj.photo && messageObj.photo.length > 0) {
        const largestPhoto = messageObj.photo[messageObj.photo.length - 1];
        const fileRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${largestPhoto.file_id}`);
        const fileData = await fileRes.json();
        
        if (fileData.ok) {
          const imgRes = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileData.result.file_path}`);
          const arrayBuffer = await imgRes.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          imagePart = {
            inlineData: {
              data: base64,
              mimeType: "image/jpeg"
            }
          };
        }
      }
      
      let prompt = '';
      if (isEdit) {
        prompt = `
Kamu adalah asisten pencatat keuangan. Pengguna ingin merevisi data transaksi sebelumnya.
Data Sebelumnya:
"""
${oldData}
"""
Koreksi dari Pengguna: "${text}"

Daftar Kategori & Pilihan Budget:
${categoryTreeText}
Daftar Dompet: ${wallets?.map(w => w.name).join(', ')}

Perbaiki data JSON sebelumnya berdasarkan koreksi. Kembalikan HANYA JSON murni (tanpa markdown), struktur:
{
  "amount": number (angka saja),
  "description": string,
  "notes": string,
  "type": "expense" | "income",
  "categoryName": string (pilih NAMA persis dari Daftar Kategori),
  "budgetItemName": string (opsional, HANYA BOLEH memilih dari Pilihan Budget yang ada di dalam Kategori terpilih),
  "walletName": string (pilih NAMA persis dari Daftar Dompet)
}`;
      } else {
        const baseMsg = messageObj.photo ? (text || "Ini struk/bukti transaksi. Tolong analisa total dan deskripsinya.") : `Pesan: "${text}"`;
        prompt = `
Kamu adalah asisten pencatat keuangan. Ekstrak informasi dari pesan atau gambar pengguna.
Pesan ini dikirim oleh: ${senderName}.
ATURAN KHUSUS: Jika transaksi berupa beli makan, minuman, atau jajan, carilah budget item yang mengandung nama "${senderName}" (contoh: "Harian ${senderName}") di Pilihan Budget untuk diisikan ke "budgetItemName".

${baseMsg}

Daftar Kategori & Pilihan Budget:
${categoryTreeText}
Daftar Dompet: ${wallets?.map(w => w.name).join(', ')}

Kembalikan hasil dalam format JSON yang valid (tanpa markdown), dengan struktur:
{
  "amount": number (angka saja, amati struk atau pesan untuk total pengeluaran/pemasukan),
  "description": string (deskripsi utama, misal "Belanja Bulanan", "Makan Siang", "Gaji"),
  "notes": string (opsional, detail item dari struk/pesan, pisahkan dengan koma),
  "type": "expense" | "income" (amati apakah ini uang masuk atau keluar),
  "categoryName": string (opsional, WAJIB pilih NAMA persis dari Daftar Kategori di atas jika sesuai),
  "budgetItemName": string (opsional, HANYA BOLEH memilih dari Pilihan Budget yang ada di dalam Kategori terpilih. Jika tidak ada, isi null),
  "walletName": string (opsional, WAJIB pilih NAMA persis dari Daftar Dompet di atas jika disebut)
}
Pastikan hanya me-return string JSON murni tanpa \`\`\`json.
`;
      }

      let contentArray: any = prompt;
      if (imagePart) {
        contentArray = [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}` } }
        ];
      }

      const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-nano-12b-v2-vl:free",
          messages: [{ role: "user", content: contentArray }],
          temperature: 0.1
        })
      });

      if (!orRes.ok) {
         const errText = await orRes.text();
         throw new Error("OpenRouter API Error: " + errText);
      }
      const orData = await orRes.json();
      let jsonText = orData.choices[0].message.content.trim();
      
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Format balasan AI tidak valid: " + jsonText);

      const parsed = JSON.parse(jsonMatch[0]);

      // 3. Match Data
      let matchedWallet = null;
      if (parsed.walletName && parsed.walletName !== '-' && wallets) {
        matchedWallet = wallets.find(w => w.name.toLowerCase() === parsed.walletName.toLowerCase() || parsed.walletName.toLowerCase().includes(w.name.toLowerCase()) || w.name.toLowerCase().includes(parsed.walletName.toLowerCase()));
      }
      
      let catName = parsed.categoryName || '-';
      let budName = parsed.budgetItemName || '-';
      let dompetName = matchedWallet ? matchedWallet.name : '-';

      // Validasi: Pastikan Budget Item benar-benar milik Kategori yang dipilih
      if (budName !== '-' && catName !== '-' && budgetItems && categories) {
        const matchedCat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
        const matchedBudget = budgetItems.find(b => 
          b.name.toLowerCase() === budName.toLowerCase() || 
          budName.toLowerCase().includes(b.name.toLowerCase())
        );
        
        // Jika budget item ditemukan, tetapi category_id-nya TIDAK SAMA dengan kategori yang dipilih AI, 
        // berarti AI halusinasi mencatut budget item dari kategori lain. Batalkan budget itemnya!
        if (matchedCat && matchedBudget && matchedBudget.category_id && matchedBudget.category_id !== matchedCat.id) {
          budName = '-';
        }
      }
      
      const msgText = `Menunggu Konfirmasi Transaksi:
Nominal: Rp ${parsed.amount.toLocaleString('id-ID')}
Tipe: ${parsed.type}
Deskripsi: ${parsed.description || '-'}
Catatan: ${parsed.notes || '-'}
Kategori: ${catName}
Budget Item: ${budName}
Dompet: ${dompetName}
Raw Amount: ${parsed.amount}`;

      let buttons = [];
      if (matchedWallet) {
        buttons = [
          [{ text: `✅ Konfirmasi & Simpan`, callback_data: `confirm_save` }],
          [{ text: `✏️ Revisi (Edit AI)`, callback_data: `edit_tx` }, { text: `❌ Batal`, callback_data: `cancel_tx` }]
        ];
      } else {
        buttons = [
          [{ text: `💵 Cash`, callback_data: `sel_type|cash` }, { text: `🏦 Bank`, callback_data: `sel_type|bank` }, { text: `📱 E-Wallet`, callback_data: `sel_type|ewallet` }],
          [{ text: `✏️ Revisi (Edit AI)`, callback_data: `edit_tx` }, { text: `❌ Batal`, callback_data: `cancel_tx` }]
        ];
      }

      if (loadingMsgId) await this.deleteMessage(chatId, loadingMsgId);
      await this.sendMessage(chatId, msgText, {
        reply_markup: { inline_keyboard: buttons }
      });

    } catch (error: any) {
      console.error('Telegram parse error:', error);
      if (loadingMsgId) await this.deleteMessage(chatId, loadingMsgId);
      await this.sendMessage(chatId, `Maaf, terjadi kesalahan:\n${error.message}`);
    }
  },

  async processCallbackQuery(chatId: number, data: string, queryId: string, messageId: number, messageText: string, senderId?: number) {
    const userId = getUserIdFromChatId(senderId || chatId);
    
    if (!userId) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: queryId, text: 'Maaf, Anda tidak memiliki akses.', show_alert: true })
      });
      return;
    } // Acknowledge callback
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: queryId })
    });

    const parts = data.split('|');

    if (parts[0] === 'edit_tx') {
      await this.deleteMessage(chatId, messageId);
      await this.sendMessage(chatId, `MODE REVISI ✏️\n\n${messageText}\n\n⚠️ Balas (Reply) pesan ini dengan koreksi kamu! (Contoh: "Ganti kategori jadi Makanan" atau "Nominalnya 60rb")`, {
        reply_markup: { force_reply: true, input_field_placeholder: 'Ketik revisi (wajib reply)...' }
      });
      return;
    }

    if (parts[0] === 'cancel_tx') {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId, text: `❌ Transaksi dibatalkan.` })
      });
      return;
    }

    if (parts[0] === 'cmd_income') {
      await this.sendMessage(chatId, `Silakan ketik nominal dan keterangan pemasukan Anda.\nContoh: "Gaji bulan ini 5000000 ke rekening BCA"`, {
        reply_markup: { force_reply: true, input_field_placeholder: 'Ketik info pemasukan...' }
      });
      return;
    }

    if (parts[0] === 'cmd_expense') {
      await this.sendMessage(chatId, `Silakan ketik atau fotokan struk pengeluaran Anda.\nContoh: "Makan siang 50rb" atau cukup kirim foto struknya.`, {
        reply_markup: { force_reply: true, input_field_placeholder: 'Ketik info pengeluaran / kirim struk...' }
      });
      return;
    }

    if (parts[0] === 'cmd_report') {
      // Show loading message first since this will take time (DB + Gemini AI)
      const loadRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: '📊 Menyusun laporan keuangan dan menganalisa data dengan AI...' })
      });
      const loadMsg = await loadRes.json();
      const loadMsgId = loadMsg?.result?.message_id;

      const now = new Date();
      // Format YYYY-MM
      const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      const currentMonthName = monthNames[now.getMonth()];
      const prevMonthName = monthNames[startOfPrevMonth.getMonth()];
      const currentYear = now.getFullYear();

      // 1. Fetch Data
      const { data: currentTxs } = await supabase.from('transactions').select('amount, type, category_id')
        .gte('date', startOfMonth.toISOString())
        .lte('date', endOfMonth.toISOString());
        
      const { data: prevTxs } = await supabase.from('transactions').select('amount, type')
        .gte('date', startOfPrevMonth.toISOString())
        .lte('date', endOfPrevMonth.toISOString());

      const { data: budgetItems } = await supabase.from('budget_items').select('amount');
      const { data: categories } = await supabase.from('categories').select('id, name');

      // 2. Calculations
      let income = 0;
      let expense = 0;
      const categoryExpenses: Record<string, number> = {};

      currentTxs?.forEach(tx => {
        if (tx.type === 'income') {
          income += tx.amount;
        } else {
          expense += tx.amount;
          if (tx.category_id) {
            categoryExpenses[tx.category_id] = (categoryExpenses[tx.category_id] || 0) + tx.amount;
          }
        }
      });
      const net = income - expense;

      let prevExpense = 0;
      prevTxs?.forEach(tx => {
        if (tx.type === 'expense') prevExpense += tx.amount;
      });

      // 3. Daily Average
      const currentDay = now.getDate();
      const avgDaily = Math.round(expense / currentDay);

      // 4. Top Spending
      const topCatIds = Object.keys(categoryExpenses).sort((a, b) => categoryExpenses[b] - categoryExpenses[a]).slice(0, 3);
      const topCategories = topCatIds.map((id, index) => {
        const catName = categories?.find(c => c.id === id)?.name || 'Lainnya';
        const medals = ['🥇', '🥈', '🥉'];
        return `${medals[index]} ${catName} — Rp ${categoryExpenses[id].toLocaleString('id-ID')}`;
      });

      // 5. Budget Used
      let totalBudget = 0;
      budgetItems?.forEach(b => totalBudget += b.amount);
      let budgetText = '';
      if (totalBudget > 0) {
        const budgetPct = Math.round((expense / totalBudget) * 100);
        const sisaBudget = Math.max(0, totalBudget - expense);
        budgetText = `${budgetPct > 100 ? '>100' : budgetPct}% (sisa Rp ${sisaBudget.toLocaleString('id-ID')})`;
      } else {
        budgetText = expense > 0 ? '>100% (sisa Rp 0)' : 'Tidak ada budget diatur bulan ini.';
      }

      // 6. vs Previous Month
      let vsText = '';
      if (prevExpense === 0) {
        vsText = 'Belum ada data pengeluaran bulan lalu.';
      } else {
        const diff = expense - prevExpense;
        const pctChange = Math.round((Math.abs(diff) / prevExpense) * 100);
        if (diff > 0) {
          vsText = `Expense naik ${pctChange}%`;
        } else if (diff < 0) {
          vsText = `Expense turun ${pctChange}%`;
        } else {
          vsText = 'Expense sama dengan bulan lalu';
        }
      }

      // 7. AI Insight
      const prompt = `Kamu adalah HanFin, asisten keuangan pintar dan ramah. Berikan insight pendek (maksimal 2-3 kalimat) tentang laporan keuangan bulan ${currentMonthName} ini.
Gunakan data berikut:
- Pemasukan: Rp ${income}
- Pengeluaran: Rp ${expense} (Sisa Uang: Rp ${net})
- Top 3 Pengeluaran: ${topCategories.join(', ')}
- Budget terpakai: ${budgetText}
- Dibanding bulan lalu: ${vsText}

Saran harus memotivasi, jujur (kalau boros bilang boros, kalau bagus puji), gunakan 1-2 emoji. Jangan menggunakan format list, tulis seperti paragraf singkat saja.`;

      let insight = '';
      try {
        const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "nvidia/nemotron-nano-12b-v2-vl:free",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
          })
        });
        const orData = await orRes.json();
        insight = orData.choices[0].message.content.trim();
      } catch (e) {
        insight = 'Terus semangat mengatur keuangan bulan ini ya!';
      }

      // 8. Build Final Output
      const sign = net > 0 ? '+' : '';
      const text = `📊 *Ringkasan ${currentMonthName} ${currentYear}*

💰 Income Rp ${income.toLocaleString('id-ID')}
💸 Expense Rp ${expense.toLocaleString('id-ID')}
💵 Net ${sign}Rp ${net.toLocaleString('id-ID')}

📅 *Avg Daily Spend*
Rp ${avgDaily.toLocaleString('id-ID')}/hari

🏆 *Top Spending*
${topCategories.length > 0 ? topCategories.join('\n') : 'Belum ada pengeluaran'}

🎯 *Budget Used*
${budgetText}

📈 *vs ${prevMonthName}*
${vsText}

🤖 *HanFin Insight*
_${insight}_`;

      if (loadMsgId) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, message_id: loadMsgId, text, parse_mode: 'Markdown' }) 
        });
      } else {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }) 
        });
      }
      return;
    }

    if (parts[0] === 'sel_type') {
      const wType = parts[1];
      // Fetch WITHOUT user_id to see family wallets
      const { data: wallets } = await supabase.from('wallets').select('*').eq('wallet_category', wType);
      
      let buttons = [];
      if (wallets && wallets.length > 0) {
        // Deduplicate wallets by name just in case
        const uniqueWallets = Array.from(new Map(wallets.map(w => [w.name, w])).values());
        buttons = uniqueWallets.map((w: any) => ([{ text: `💳 ${w.name}`, callback_data: `tx_wallet|${w.id}` }]));
      } else {
        buttons = [[{ text: `(Kosong)`, callback_data: `dummy` }]];
      }
      buttons.push([{ text: `🔙 Kembali`, callback_data: `back_type` }, { text: `❌ Batal`, callback_data: `cancel_tx` }]);

      // Modify the text to replace the Dompet line or TIPE dompet instruction
      const newText = messageText.includes('Silakan pilih TIPE') 
        ? messageText.replace('Silakan pilih TIPE dompet di bawah ini:', `Silakan pilih Dompet (${wType.toUpperCase()}):`)
        : messageText;

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId, text: newText, reply_markup: { inline_keyboard: buttons } })
      });
    }

    if (parts[0] === 'back_type') {
      const buttons = [
        [{ text: `💵 Cash`, callback_data: `sel_type|cash` }, { text: `🏦 Bank`, callback_data: `sel_type|bank` }, { text: `📱 E-Wallet`, callback_data: `sel_type|ewallet` }],
        [{ text: `✏️ Revisi (Edit AI)`, callback_data: `edit_tx` }, { text: `❌ Batal`, callback_data: `cancel_tx` }]
      ];
      const newText = messageText.replace(/Silakan pilih Dompet \(.*\):/, 'Silakan pilih TIPE dompet di bawah ini:');
      
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId, text: newText, reply_markup: { inline_keyboard: buttons } })
      });
    }

    if (parts[0] === 'tx_wallet') {
      const walletId = parts[1];
      const { data: walletData } = await supabase.from('wallets').select('name').eq('id', walletId).single();
      const wName = walletData ? walletData.name : '-';

      // Update the message text to show the selected wallet
      const updatedText = messageText.replace(/Dompet: .*/, `Dompet: ${wName}`).replace(/Silakan pilih Dompet \(.*\):/, '');
      
      const buttons = [
        [{ text: `✅ Konfirmasi & Simpan`, callback_data: `confirm_save` }],
        [{ text: `✏️ Revisi (Edit AI)`, callback_data: `edit_tx` }, { text: `❌ Batal`, callback_data: `cancel_tx` }]
      ];

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId, text: updatedText.trim(), reply_markup: { inline_keyboard: buttons } })
      });
    }

    if (parts[0] === 'confirm_save') {

      // Parse values from messageText
      const typeMatch = messageText.match(/Tipe: (.*)/);
      const descMatch = messageText.match(/Deskripsi: (.*)/);
      const notesMatch = messageText.match(/Catatan: (.*)/);
      const catMatch = messageText.match(/Kategori: (.*)/);
      const budMatch = messageText.match(/Budget Item: (.*)/);
      const dompetMatch = messageText.match(/Dompet: (.*)/);
      const rawAmtMatch = messageText.match(/Raw Amount: (.*)/);

      const type = typeMatch ? typeMatch[1].trim() : 'expense';
      const description = descMatch ? descMatch[1].trim() : 'Catatan dari Telegram';
      const notes = notesMatch ? notesMatch[1].trim() : '';
      const catName = catMatch ? catMatch[1].trim() : '-';
      const budName = budMatch ? budMatch[1].trim() : '-';
      const dompetName = dompetMatch ? dompetMatch[1].trim() : '-';
      const amount = rawAmtMatch ? Number(rawAmtMatch[1].trim()) : 0;

      // Look up IDs from Names
      let categoryId = 'none';
      let budgetItemId = 'none';
      let walletId = '';
      
      if (catName !== '-') {
        const { data: c } = await supabase.from('categories').select('id').ilike('name', catName).single();
        if (c) categoryId = c.id;
      }
      if (budName !== '-') {
        // Remove user_id filter to allow fetching spouse's budget items
        const { data: b } = await supabase.from('budget_items').select('id').ilike('name', budName).single();
        if (b) {
          budgetItemId = b.id;
        }
      }
      if (dompetName !== '-') {
        const { data: w } = await supabase.from('wallets').select('id, name').ilike('name', dompetName).single();
        if (w) walletId = w.id;
      }

      if (!walletId) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: queryId, text: '⚠️ Harap pilih Dompet terlebih dahulu!', show_alert: true })
        });
        return;
      }

      const walletName = dompetName;

      // Use a loading step for the final save so we can edit it directly to success
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId, text: `⏳ Sedang menyimpan transaksi...` })
      });

      await this.saveTransaction(chatId, userId, amount, description, notes === '-' ? '' : notes, type, categoryId, budgetItemId, walletId, true);

      // Edit the exact same message box into the final beautiful success message
      const successText = `🎉 *Transaksi Berhasil Disimpan!* 🎉

💸 *Nominal:* Rp ${amount.toLocaleString('id-ID')}
📝 *Deskripsi:* ${description}
📌 *Catatan:* ${notes === '-' ? 'Tidak ada' : notes}
🏷️ *Kategori:* ${catName}
🎯 *Budget:* ${budName}
💳 *Dompet:* ${walletName}

_Semangat mengatur keuangan!_ 💪`;

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: successText,
          parse_mode: 'Markdown'
        })
      });
    }
  },

  async saveTransaction(chatId: number, userId: string, amount: number, description: string, notes: string, type: string, categoryId: string, budgetItemId: string, walletId: string, skipSuccessMessage: boolean = false) {
    try {
      const payload = {
        user_id: userId,
        wallet_id: walletId,
        category_id: categoryId === 'none' ? null : categoryId,
        budget_item_id: budgetItemId === 'none' ? null : budgetItemId,
        type: type as 'expense' | 'income',
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        description: description,
        notes: notes,
        installment_total_month: 1,
        is_split: false
      };

      const { data, error } = await supabase.from('transactions').insert(payload).select().single();
      
      if (error) {
        console.error('Supabase error:', error);
        await this.sendMessage(chatId, `Gagal menyimpan transaksi ke database. Alasan: ${error.message || JSON.stringify(error)}`);
        return;
      }

      if (!skipSuccessMessage) {
        await this.sendMessage(chatId, `✅ Berhasil! Transaksi Rp ${amount.toLocaleString('id-ID')} telah dicatat.`);
      }
    } catch (error) {
      console.error('Save tx error:', error);
      await this.sendMessage(chatId, 'Terjadi kesalahan sistem.');
    }
  },

  async sendMessage(chatId: number, text: string, options: any = {}) {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        ...options
      })
    });
    return res.json();
  },

  async deleteMessage(chatId: number, messageId: number) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId
      })
    });
  }
};
