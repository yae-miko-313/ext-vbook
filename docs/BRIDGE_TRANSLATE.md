

# Local Quick Translator Bridge

Local bridge API for Quick Translator.

## Translate

```ts
Qt.translate(text, to, extras?)
```

### Parameters

```json
{
  "text": "source text to translate",

  "to": "target mode/language id such as 'vp' or 'hv'",

  "extras": {
    "first_line_chapter_name": true,
    // Treat first line as chapter title

    "chapter_name": true,
    // Translate whole input as chapter title

    "person_name": true,
    // Translate input as person name

    "first_capitalize": true,
    // Capitalize first translated character

    "convert_simplified": true,
    // true: convert to Simplified Chinese when enabled
    // false: disable automatic Simplified conversion

    "ner": true
    // Named-entity translation type
  }
}
```

## Response

```json
{
  "translateText": "translated text",
  // Final translated text

  "segments": [
    {
      "srcStart": 0,
      // Start index in source text

      "srcLen": 4,
      // Source segment length

      "transStart": 0,
      // Start index in translated text

      "transLen": 6,
      // Translated segment length

      "type": 1,
      // Segment/entity type
    }
  ]
}
```

## Notes

- `segments` is optional.
- Returns `null` if native bridge returns invalid JSON.