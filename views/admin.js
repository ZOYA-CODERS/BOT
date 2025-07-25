<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Admin Panel - Song Requests</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <div class="container">
    <h1>Admin Panel - Reply to Requests</h1>

    <ul class="requests-list">
      <% requests.forEach(r => { %>
        <li>
          <strong><%= r.name %>:</strong> <%= r.message %><br/>
          <form action="/reply/<%= r._id %>" method="POST" class="reply-form">

<input type="text" name="reply" placeholder="Type reply here" value="<%= r.reply %>" />
            <button type="submit">Send Reply</button>
          </form>
        </li>
      <% }) %>
    </ul>
  </div>
</body>
</html>
