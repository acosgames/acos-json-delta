/**
 * Generate JSON delta and merge to another JSON 
 * 
 * To generate a delta, simply pass the original JSON (from) and the modified JSON (to)
 * To merge, use the saved JSON (from) stored in memory, and the delta JSON that was networked over to merge into a single JSON
 * Supports "hidden" keys that are prefixed with '_' underscore.  
 *   The hidden function will delete the keys with underscore from the passed object and return only the hidden keys as a new object.  
 *  
 * The delta comes with several features:
 * - Detect array changes by specifying only specifying the used indices with action type
 *    - Nested arrays supported
 *    - Resizing supported
 *    - Setting value of index supported
 * - Arrays with changes will have '#' prefixing the key of that array
 * - Deleted keys of an object are stored in the key '$' as an array of keys
 */

function delta(from, to, result) {
    try {
        if (Array.isArray(from)) {
            return arrDelta(from, to, []);
        }

        if (isObject(from)) {
            return objDelta(from, to, {});
        }

        if (from != to) {
            result = to;
        }
    } catch (e) {
        console.error(e);
    }
    return result;
}

function isObject(x) {
    return (
        x != null &&
        (typeof x === "object" || typeof x === "function") &&
        !Array.isArray(x)
    );
}
function objDelta(from, to, result) {
    result = result || {};

    for (var key in to) {
        if (key[0] == "#") {
            let fixedKey = key.substring(1);
            if (typeof to[key] !== "undefined") {
                to[fixedKey] = to[key];
                delete to[key];
            }
            if (typeof from[key] !== "undefined") {
                from[fixedKey] = from[key];
                delete from[key];
            }

            key = fixedKey;
        }

        if (!(key in from)) {
            result[key] = to[key];
            continue;
        }

        let child = delta(from[key], to[key]);

        if (typeof child !== "undefined" && child != null) {
            if (
                Array.isArray(from[key]) &&
                Array.isArray(to[key]) &&
                child.length > 0
            ) {
                result["#" + key] = child;
                continue;
            }

            if (
                typeof child === "string" ||
                typeof child === "number" ||
                typeof child === "boolean" ||
                Object.keys(child).length > 0
            ) {
                result[key] = child;
            }
        }

        // else
        //     result[key] = to[key];
    }

    for (var key in from) {
        if (!(key in to)) {
            if (!result["$"]) result["$"] = [];
            result["$"].push(key);
        }
    }
    return result;
}

function arrDelta(from, to, result) {
    result = result || [];

    //return to;
    // if (from.length != to.length) {
    //     return to;
    // }

    let changes = [];
    let resize = null;
    let moves = [];

    if (from.length == 0 && to.length > 0) {
        return to;
    }

    to = to || [];
    // let arrMapFrom = {};
    // let arrMapTo = {};
    // let valMap = {};
    let maxSize = Math.max(to?.length || 0, from?.length || 0);

    for (var i = 0; i < maxSize; i++) {
        let valf = from[i];
        let valt = to[i];

        let fstr = JSON.stringify(valf);
        let tstr = JSON.stringify(valt);

        if (fstr == tstr) continue;

        if (i >= to.length) {
            changes.push({ value: i, type: "resize" });
            // changes.push(-i);
            // resize = i;
            break;
        }

        changes.push({ index: i, type: "nested", value: valt });
        // changes.push(valt);
    }

    for (var i = 0; i < changes.length; i++) {
        //let add = adds[i];
        let change = changes[i];
        let toIndex = change.index;
        let type = change.type;

        if (type == "resize") continue;

        let toVal = change.value;
        let child;

        let isFromArray = Array.isArray(from[toIndex]);
        let isToArray = Array.isArray(toVal);
        if (
            isFromArray &&
            isToArray &&
            from[toIndex].length == 0 &&
            toVal.length > 0
        ) {
            change.type = "setvalue";
            child = delta(from[toIndex], toVal);
        } else if (
            typeof from[toIndex] != typeof toVal ||
            !isFromArray ||
            !isToArray
        ) {
            change.type = "setvalue";
            child = delta(from[toIndex], toVal);
        } else {
            child = delta(from[toIndex], toVal);
        }

        change.value = child;
    }

    result = changes;

    return result;
}

function hidden(obj) {
    if (isObject(obj)) {
        let result = {};
        for (var key in obj) {
            if (key[0] == "_" || (key[0] == "#" && key[1] == "_")) {
                result[key] = JSON.parse(JSON.stringify(obj[key]));
                delete obj[key];
                continue;
            }
            let test = hidden(obj[key]);
            if (typeof test !== "undefined") {
                result[key] = test;
            }
            if (isObject(obj[key]) && Object.keys(obj[key]).length == 0) {
                delete obj[key];
            }
        }

        if (Object.keys(result).length == 0) return undefined;
        return result;
    }

    return undefined;
}

function merge(from, delta) {
    if (!Array.isArray(delta) && !isObject(delta)) {
        return delta;
    }

    if (typeof from != typeof delta) {
        return delta;
    }

    for (var key in delta) {
        if (key == "$") {
            let arr = delta[key];
            if (arr && arr.length > 0)
                for (var i = 0; i < arr.length; i++) {
                    let val = arr[i];
                    if (from[val]) delete from[val];
                }

            continue;
        }

        if (key[0] == "#") {
            let realkey = key.substring(1);
            from[realkey] = mergeArrayChanges(from[realkey], delta[key]);
            continue;
        }

        if (!from) {
            from = {};
            from[key] = delta[key];
            continue;
        }

        if (!(key in from)) {
            from[key] = delta[key];

            if (isObject(delta[key])) {
                from[key] = merge(from[key], delta[key]);
                continue;
            }

            continue;
        }

        if (Array.isArray(delta[key])) {
            from[key] = delta[key];
            continue;
        }
        if (isObject(delta[key])) {
            from[key] = merge(from[key], delta[key]);
            continue;
        }

        from[key] = delta[key];
    }

    return from;
}

function mergeArrayChanges(from, changes) {
    if (!from) {
        return changes;
    }
    for (var i = 0; i < changes.length; i++) {
        let change = changes[i];
        let index = change.index;
        let type = change.type;
        let value = change.value;

        //type of resize
        if (type == "resize") {
            from.length = value; // = from.slice(0, value);
            continue;
        }

        //type of full update
        if (type == "setvalue") {
            from[index] = merge(from[index], value);
            continue;
        }

        if (type == "nested") {
            from[index] = mergeArrayChanges(from[index], value);
            continue;
        }

        return from; //exit early
    }

    return from;
}


module.exports = { delta, merge, hidden };


