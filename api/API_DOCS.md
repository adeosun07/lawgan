# Lawgan Backend API Usage

Base URL: (set this to your deployed URL or local server)

## Admin

### Sign up
- Method: POST
- Path: /admin/signup
- Body:
  - name (string, required)
  - email (string, required)
  - password (string, required)
- Success: 201
  - admin: { id, name, email, created_at }
- Example response:
```json
{
  "admin": {
    "id": "d2f1a1b4-3c65-4a28-9a6c-5f1e2c8d9f10",
    "name": "Editor One",
    "email": "editor@example.com",
    "created_at": "2026-01-29T09:12:34.000Z"
  }
}
```

### Sign in
- Method: POST
- Path: /admin/signin
- Body:
  - email (string, required)
  - password (string, required)
- Success: 200
  - token (JWT)
  - admin: { id, name, email }
- Example response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "d2f1a1b4-3c65-4a28-9a6c-5f1e2c8d9f10",
    "name": "Editor One",
    "email": "editor@example.com"
  }
}
```

## Articles

### Post article (publish)
- Method: POST
- Path: /articles/publish
- Body:
  - title (string, required)
  - slug (string, required, unique)
  - summary (string, optional)
  - content (string, required)
  - category (string, required) → law | politics | foreign affairs | reviews
  - is_breaking (boolean, optional)
  - author (string, optional)
  - image_base64 (string, optional) → raw base64 OR data URL
  - image_mime (string, optional) → e.g. image/png, image/jpeg
- Success: 201
  - article: full article record
- Example response:
```json
{
  "article": {
    "id": "7c1b60de-8b3f-42f1-b6ff-3d25f4c132aa",
    "title": "Supreme Court Updates",
    "slug": "supreme-court-updates",
    "summary": "Key updates from the court today",
    "content": "...",
    "category": "law",
    "is_breaking": false,
    "published": true,
    "author": "Jane Doe",
    "image_url": null,
    "image_mime": null,
    "created_at": "2026-01-29T09:30:10.000Z",
    "updated_at": "2026-01-29T09:30:10.000Z"
  }
}
```

### Edit article (patch)
- Method: PATCH
- Path: /articles/edit
- Body:
  - id (uuid, required) OR slug (string, required)
  - title, newSlug, summary, content, category, is_breaking, published, author (optional)
  - image_base64 (optional) → raw base64 OR data URL
  - image_mime (optional)
- Success: 200
  - article: full article record
- Example response:
```json
{
  "article": {
    "id": "7c1b60de-8b3f-42f1-b6ff-3d25f4c132aa",
    "title": "Supreme Court Updates (Revised)",
    "slug": "supreme-court-updates",
    "summary": "Key updates from the court today",
    "content": "...",
    "category": "law",
    "is_breaking": false,
    "published": true,
    "author": "Jane Doe",
    "image_url": null,
    "image_mime": null,
    "created_at": "2026-01-29T09:30:10.000Z",
    "updated_at": "2026-01-29T10:05:54.000Z"
  }
}
```

### Get all articles
- Method: GET
- Path: /articles
- Success: 200
  - articles: array of article records
- Example response:
```json
{
  "articles": [
    {
      "id": "7c1b60de-8b3f-42f1-b6ff-3d25f4c132aa",
      "title": "Supreme Court Updates",
      "slug": "supreme-court-updates",
      "summary": "Key updates from the court today",
      "content": "...",
      "category": "law",
      "is_breaking": false,
      "published": true,
      "author": "Jane Doe",
      "image_url": null,
      "image_mime": null,
      "created_at": "2026-01-29T09:30:10.000Z",
      "updated_at": "2026-01-29T09:30:10.000Z"
    }
  ]
}
```

### Get articles by category
- Method: GET
- Path: /articles/category/:category
- Params:
  - category: law | politics | foreign-affairs | foreign affairs | reviews
- Success: 200
  - articles: array of article records
- Example response:
```json
{
  "articles": [
    {
      "id": "7c1b60de-8b3f-42f1-b6ff-3d25f4c132aa",
      "title": "Supreme Court Updates",
      "slug": "supreme-court-updates",
      "summary": "Key updates from the court today",
      "content": "...",
      "category": "law",
      "is_breaking": false,
      "published": true,
      "author": "Jane Doe",
      "image_url": null,
      "image_mime": null,
      "created_at": "2026-01-29T09:30:10.000Z",
      "updated_at": "2026-01-29T09:30:10.000Z"
    }
  ]
}
```

### Delete article by id
- Method: DELETE
- Path: /articles/delete
- Body:
  - id (uuid, required)
- Success: 200
  - deleted: { id }
- Example response:
```json
{
  "deleted": {
    "id": "7c1b60de-8b3f-42f1-b6ff-3d25f4c132aa"
  }
}
```

## Editorial Boards

### Create editorial board
- Method: POST
- Path: /editorial-boards
- Body:
  - name (string, required)
  - about (string, optional)
  - image_base64 (string, optional) → raw base64 OR data URL
  - image_mime (string, optional)
- Success: 201
  - editorialBoard: full record
- Example response:
```json
{
  "editorialBoard": {
    "id": "fd1d7a9c-8d5e-4d4a-9ed2-8f1d5e2a0c11",
    "name": "Editor-in-Chief",
    "image": null,
    "image_mime": null,
    "about": "Leads the editorial direction."
  }
}
```

### Update editorial board
- Method: PATCH
- Path: /editorial-boards
- Body:
  - id (uuid, required)
  - name, about (optional)
  - image_base64 (optional)
  - image_mime (optional)
- Success: 200
  - editorialBoard: full record
- Example response:
```json
{
  "editorialBoard": {
    "id": "fd1d7a9c-8d5e-4d4a-9ed2-8f1d5e2a0c11",
    "name": "Editor-in-Chief",
    "image": null,
    "image_mime": null,
    "about": "Leads the editorial direction and strategy."
  }
}
```

### Delete editorial board
- Method: DELETE
- Path: /editorial-boards
- Body:
  - id (uuid, required)
- Success: 200
  - deleted: { id }
- Example response:
```json
{
  "deleted": {
    "id": "fd1d7a9c-8d5e-4d4a-9ed2-8f1d5e2a0c11"
  }
}
```

## Executives

### Get all executives
- Method: GET
- Path: /executives
- Success: 200
  - executives: array of records
- Example response:
```json
{
  "executives": [
    {
      "id": "d0b1e2a3-9d8c-4b1f-9f9c-1f8f3a2b4c5d",
      "name": "Jane Doe",
      "image": null,
      "position": "Chief Executive Officer",
      "image_mime": null,
      "about": "Leads overall strategy."
    }
  ]
}
```

### Create executive
- Method: POST
- Path: /executives
- Body:
  - name (string, required)
  - position (string, optional)
  - about (string, optional)
  - image_base64 (string, optional) → raw base64 OR data URL
  - image_mime (string, optional)
- Success: 201
  - executive: full record
- Example response:
```json
{
  "executive": {
    "id": "d0b1e2a3-9d8c-4b1f-9f9c-1f8f3a2b4c5d",
    "name": "Jane Doe",
    "image": null,
    "position": "Chief Executive Officer",
    "image_mime": null,
    "about": "Leads overall strategy."
  }
}
```

### Update executive
- Method: PATCH
- Path: /executives
- Body:
  - id (uuid, required)
  - name, position, about (optional)
  - image_base64 (optional)
  - image_mime (optional)
- Success: 200
  - executive: full record
- Example response:
```json
{
  "executive": {
    "id": "d0b1e2a3-9d8c-4b1f-9f9c-1f8f3a2b4c5d",
    "name": "Jane Doe",
    "image": null,
    "position": "Chief Executive Officer",
    "image_mime": null,
    "about": "Leads overall strategy and operations."
  }
}
```

### Delete executive
- Method: DELETE
- Path: /executives
- Body:
  - id (uuid, required)
- Success: 200
  - deleted: { id }
- Example response:
```json
{
  "deleted": {
    "id": "d0b1e2a3-9d8c-4b1f-9f9c-1f8f3a2b4c5d"
  }
}
```

## Advertisements

### Publish advertisement
- Method: POST
- Path: /advertisements/publish
- Body:
  - image_base64 (string, required) → raw base64 OR data URL
  - image_mime (string, optional)
  - url (string, required)
  - owner (string, required)
  - page (string, required)
- Success: 201
  - advertisement: full record
- Example response:
```json
{
  "advertisement": {
    "id": "3f0b5a21-1b32-4c0f-8d8c-7b42a35f1b90",
    "image": null,
    "image_mime": "image/png",
    "url": "https://example.com",
    "owner": "Acme Corp",
    "page": "home",
    "created_at": "2026-01-30T10:15:00.000Z",
    "updated_at": "2026-01-30T10:15:00.000Z"
  }
}
```

### Get all advertisements
- Method: GET
- Path: /advertisements
- Success: 200
  - advertisements: array of records
- Example response:
```json
{
  "advertisements": [
    {
      "id": "3f0b5a21-1b32-4c0f-8d8c-7b42a35f1b90",
      "image": null,
      "image_mime": "image/png",
      "url": "https://example.com",
      "owner": "Acme Corp",
      "page": "home",
      "created_at": "2026-01-30T10:15:00.000Z",
      "updated_at": "2026-01-30T10:15:00.000Z"
    }
  ]
}
```

### Get advertisements by page
- Method: GET
- Path: /advertisements/page/:page
- Params:
  - page (string, required)
- Success: 200
  - advertisements: array of records
- Example response:
```json
{
  "advertisements": [
    {
      "id": "3f0b5a21-1b32-4c0f-8d8c-7b42a35f1b90",
      "image": null,
      "image_mime": "image/png",
      "url": "https://example.com",
      "owner": "Acme Corp",
      "page": "home",
      "created_at": "2026-01-30T10:15:00.000Z",
      "updated_at": "2026-01-30T10:15:00.000Z"
    }
  ]
}
```

### Edit advertisement (patch)
- Method: PATCH
- Path: /advertisements/edit
- Body:
  - id (uuid, required)
  - image_base64 (optional)
  - image_mime (optional)
  - url (optional)
  - owner (optional)
  - page (optional)
- Success: 200
  - advertisement: full record
- Example response:
```json
{
  "advertisement": {
    "id": "3f0b5a21-1b32-4c0f-8d8c-7b42a35f1b90",
    "image": null,
    "image_mime": "image/png",
    "url": "https://example.com",
    "owner": "Acme Corp",
    "page": "home",
    "created_at": "2026-01-30T10:15:00.000Z",
    "updated_at": "2026-01-30T11:01:22.000Z"
  }
}
```

### Delete advertisement
- Method: DELETE
- Path: /advertisements/delete
- Body:
  - id (uuid, required)
- Success: 200
  - deleted: { id }
- Example response:
```json
{
  "deleted": {
    "id": "3f0b5a21-1b32-4c0f-8d8c-7b42a35f1b90"
  }
}
```

## Quotes

### Publish quote
- Method: POST
- Path: /quotes/publish
- Body:
  - title (string, required)
  - author (string, required)
- Success: 201
  - quote: full record
- Example response:
```json
{
  "quote": {
    "id": "a2f5b2c1-9d75-4e4f-9c14-6e4a0c7db119",
    "title": "Justice delayed is justice denied.",
    "author": "William E. Gladstone",
    "created_at": "2026-01-30T13:40:00.000Z",
    "updated_at": "2026-01-30T13:40:00.000Z"
  }
}
```

### Get all quotes
- Method: GET
- Path: /quotes
- Success: 200
  - quotes: array of records
- Example response:
```json
{
  "quotes": [
    {
      "id": "a2f5b2c1-9d75-4e4f-9c14-6e4a0c7db119",
      "title": "Justice delayed is justice denied.",
      "author": "William E. Gladstone",
      "created_at": "2026-01-30T13:40:00.000Z",
      "updated_at": "2026-01-30T13:40:00.000Z"
    }
  ]
}
```

### Edit quote (patch)
- Method: PATCH
- Path: /quotes/edit
- Body:
  - id (uuid, required)
  - title (optional)
  - author (optional)
- Success: 200
  - quote: full record
- Example response:
```json
{
  "quote": {
    "id": "a2f5b2c1-9d75-4e4f-9c14-6e4a0c7db119",
    "title": "Justice delayed is justice denied.",
    "author": "William E. Gladstone",
    "created_at": "2026-01-30T13:40:00.000Z",
    "updated_at": "2026-01-30T14:05:12.000Z"
  }
}
```

### Delete quote
- Method: DELETE
- Path: /quotes/delete
- Body:
  - id (uuid, required)
- Success: 200
  - deleted: { id }
- Example response:
```json
{
  "deleted": {
    "id": "a2f5b2c1-9d75-4e4f-9c14-6e4a0c7db119"
  }
}
```
