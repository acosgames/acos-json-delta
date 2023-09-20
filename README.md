# ACOS JSON Encoder for Websocket Networking

Generate a delta of your JSON data of any changes, reducing your bandwidth bytes transmitted to players. When data is received, merge it with the previous JSON data.

## Installation

```shell
npm i acos-json-delta
```

## Usage

This package is used in combination with the `acos-json-encoder` to maximize bandwidth reduction.

### CommonJS usage

```js
const { delta, merge, hidden } = require("acos-json-delta");
```

### ES6 usage

```js
import {delta, merge, hidden} = require("acos-json-delta");
```

### Delta and Merge example

```js
//example JSON data
let defaultGame = {
  state: {
    board: [
      [0, 2, 0, 2, 0, 2, 0, 2], //white
      [2, 0, 2, 0, 2, 0, 2, 0],
      [0, 2, 0, 2, 0, 2, 0, 2],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0], //black
    ],
    cells: ["", "", "", "", "", "", "", "", ""],
    startPlayer: "",
  },
  players: {},
  rules: {
    bestOf: 5,
    maxPlayers: 2,
  },
  next: {},
  events: [],
};

// mutate the JSON data
let changed = JSON.parse(JSON.stringify(defaultGame));
changed.state.board[0][0] = 1;
changed.state.cells[0] = "x";
changed.state.cells[1] = "x";
changed.state.cells[2] = "o";
changed.players["joe"] = { name: "Joe", type: "x" };
delete changed.state.startPlayer;

// build a delta of the mutated JSON
let diff = delta(defaultGame, changed, {});

// print delta
console.log("------------------");
console.log("delta1: \n", JSON.stringify(diff, null, 2));

// merge the delta with previous
let merged = merge(defaultGame, diff);

// mutate the new JSON data again
changed = JSON.parse(JSON.stringify(merged));
delete changed.players.joe.type;

// build another delta of the JSON
diff = delta(merged, changed, {});

// print delta
console.log("------------------");
console.log("delta2: \n", JSON.stringify(diff, null, 2));

// merge the delta from mutated JSON with previous
merged = merge(merged, diff);
```

##### Example Output

The array changes appear complex, but when combined with `acos-json-encoder` they are efficiently optimized to use up minimum bytes. You can identify array deltas when their key is prefixed with `#`.

Deletions of an object key are added to a key named `$` with array of keys to be deleted on merge. See delta2 example below.

```
------------------
delta1:
 {
  "state": {
    "#board": [
      {
        "index": 0,
        "type": "nested",
        "value": [
          {
            "index": 0,
            "type": "setvalue",
            "value": 1
          }
        ]
      }
    ],
    "#cells": [
      {
        "index": 0,
        "type": "setvalue",
        "value": "x"
      },
      {
        "index": 1,
        "type": "setvalue",
        "value": "x"
      },
      {
        "index": 2,
        "type": "setvalue",
        "value": "o"
      }
    ],
    "$": [
      "startPlayer"
    ]
  },
  "players": {
    "joe": {
      "name": "Joe",
      "type": "x"
    }
  }
}
------------------
delta2:
 {
  "players": {
    "joe": {
      "$": [
        "type"
      ]
    }
  }
}
```

## Methods

### `delta(from, to, result)`

Setup the default dictionary to use by this package.

##### Parameters

- **from** (JSON object or array) - Data before mutation
- **to** (JSON object or array) - Data after mutation
- **result** (JSON object or array) - Data after merging the from/to

##### Returns

**result** is returned redundantly, for readability.

.

### `merge(from, delta)`

Setup the default dictionary to use by this package.

##### Parameters

- **from** (JSON object or array) - Data previously saved
- **delta** (JSON object or array) - Delta JSON generated using the `delta` function

##### Returns

JSON data merged between the `from` and the `delta`.

.

### `hidden(json)`

##### Parameters

- **json** (JSON object or array) - Data that will be mutated to delete objects

Deletes and extracts the keys marked as hidden. Keys with prefix `_` are marked hidden.

##### Returns

Extracted hidden keys only.
