# Library Modifications

## AnyList (`backend/node_modules/anylist`)
**Reason:** To debug silent failures when saving recipes, we need to see the raw HTTP response from the server which is normally suppressed by the library.

**File:** `backend/node_modules/anylist/lib/recipe.js`

**Change:**
Added response logging to the `performOperation` method.

**File:** `backend/node_modules/anylist/lib/recipe-collection.js`

**Change:**
Added response logging to the `performOperation` method.

```javascript
// BEFORE
await this._client.post('data/user-recipe-data/update', {
    body: form,
});

// AFTER
const res = await this._client.post('data/user-recipe-data/update', {
    body: form,
});
console.log("UPDATE RESPONSE:", res.statusCode, res.body.toString());
```
