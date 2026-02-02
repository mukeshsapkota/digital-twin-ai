async function send(text: string) {
  if (!text.trim() || loading) return;
  setLoading(true);

  setMessages((m) => [...m, { role: "user", content: text }]);
  setInput("");

  try {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, content: text }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = data?.error || `Request failed (${res.status})`;
      setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${errMsg}` }]);
      return;
    }

    const reply = data.reply || "Sorry, something went wrong.";
    setMessages((m) => [...m, { role: "assistant", content: reply }]);

    try {
      const u = new SpeechSynthesisUtterance(reply);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {}
  } finally {
    setLoading(false);
  }
}

