// PhaneRealmBot webhook handler — Cloudflare Worker
// Handles /start command with inline web app button

export default {
  async fetch(request) {
    if (request.method !== 'POST') return new Response('OK', { status: 200 });

    try {
      const update = await request.json();
      
      // Handle /start command
      if (update.message?.text === '/start') {
        const chatId = update.message.chat.id;
        const firstName = update.message.from.first_name || 'Strange One';

        const response = {
          method: 'sendMessage',
          chat_id: chatId,
          text: `✨ *Welcome, ${firstName}!* ✨\n\nA mysterious egg has appeared...\n\nTap the button below to begin your journey.`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              {
                text: '🥚 Hatch Your Sparkling',
                web_app: { url: 'https://lionbabycrypto.github.io/sparkbond/' }
              }
            ]]
          }
        };

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${response.method}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response)
        });
      }
    } catch (e) {
      console.error('Webhook error:', e);
    }

    return new Response('OK', { status: 200 });
  }
}
