const { delta, merge, hidden } = require('./delta');

function testDelta() {
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
    let changed = JSON.parse(JSON.stringify(defaultGame));
    changed.state.board[0][0] = 1;
    changed.state.cells[0] = "x";
    changed.state.cells[1] = "x";
    changed.state.cells[2] = "o";
    changed.players["joe"] = { name: "Joe", type: "x" };
    delete changed.state.startPlayer;

    console.time("delta took");
    let diff = delta(defaultGame, changed, {});
    console.timeEnd("delta took");
    console.log("------------------")
    console.log("delta1: \n", JSON.stringify(diff, null, 2));
    let merged = merge(defaultGame, diff);
    // console.log("Merged: ", merged);

    changed = JSON.parse(JSON.stringify(merged));
    delete changed.players.joe.type;
    diff = delta(merged, changed, {});
    console.log("------------------")
    console.log("delta2: \n", JSON.stringify(diff, null, 2));
    merged = merge(merged, diff);
    // console.log("Merged2: ", merged);
}

testDelta();
