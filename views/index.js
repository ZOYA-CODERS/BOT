<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Song Request</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <div class="container">
<h1>🎵 Song Request</h1>
    <form action="/request" method="POST" class="request-form">
      <input type="text" name="name" placeholder="Your name" required />
      <textarea name="message" placeholder="Your request" required></textarea>
      <button type="submit">Send Request</button>
    </form>

    <h2>All Requests</h2>
    <ul class="requests-list">
      <% requests.forEach(r => { %>
        <li>
          <strong><%= r.name %>:</strong> <%= r.message %><br/>
          <% if(r.reply) { %>
            <em>Reply: <%= r.reply %></em>
          <% } else { %>
            <em>No reply yet.</em>
          <% } %>
        </li>
      <% }) %>
    </ul>
  </div>
</body>
</html>
