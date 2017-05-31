var data2 = [
    [53.925754, 27.616571],
    [52.430537, 31.009026],
    [52.436342, 31.007431],
    [53.87455625, 27.50356634],
    [53.89944552, 27.53577993],
    [52.441388, 31.003246]

];

//TEST
Array.prototype.flatten = function () {
    return [].concat.apply([], this)
};

function Emitter() {
    var values = [];
    this.emit = function (key, value) {
        values = values.concat([
            {key: key, value: value}
        ])
    };

    this.values = function () {
        return values
    };

    // group:
    this.keyValues = function () {
        var obj = values
            .reduce(function (result, pair) {
                var key = pair.key;
                var value = pair.value;
                result[key] = result[key] || [];
                result[key].push(value);
                return result
            }, {});
        return Object.keys(obj)
            .map(function (key) {
                return [key, obj[key]]
            })
    };
}

// emit => (key, value)
var wordCountMapper = function (_, item, emitter) {
    item
        .split('\n')
        .map(function (line) {
            return line.split(/\s+/);
        })
        .flatten()
        .filter(function (item) {
            return !!item
        })
        .forEach(function (word) {
            emitter.emit(word, 1)
        });
};

// (key, values) => (key2, value2)
var wordCountReducer = function (key, values, emitter) {
    // key: "dfs"
    // values: [ 1, 1, 1 ]

    var count = values
        .reduce(function (sum, item) {
            return sum + item
        }, 0);

    emitter.emit(key, count)
};

var kvTSVFormatter = function (obj) {
    return Object.keys(obj).map(function (key) {
        return key + '\t' + obj[key]
    })
};

var kMeanPhraseMapper = function (_, item, emitter) {

    console.log('item: ' + item);
    for (var em in emitter) {
        console.log('e: ' + em);
        console.log('emit: ' + emitter[em]);
    }
};


var kmeanPhase1MapperBuilder = function (centers, distance) {
    // emit => (key, value)
    // item = [52.402281,	31.021566]
    return function (key, value, emitter) {
        //   distances = [ 3, 4, 2.5]
        // console.log('>', key, value);
        var distances = centers
            .map(function (center) {
                // console.log('>>', center,
                //     distance(center, value));
                return distance(center, value)
            });

        // console.log(distances);

        var idxMin = 0, min = distances[idxMin];
        for (var i = 0; i < distances.length; i++) {
            if (min >= distances[i]) {
                min = distances[i];
                idxMin = i
            }
        }

        console.log(idxMin, min, distances);

        emitter.emit(idxMin, value)
    }
};


var kmeanPhase1ReducerBuilder = function (zeroValue, valuesSumator, meanValue) {
    // (key, values) => (key2, value2)
    // key: center idx
    // values: [ values ]
    return function (key, values, emitter) {


            console.log('RRR', key, values);


        var count = values.length;
        if (count == 0) {
            return zeroValue;
        }

        // find mean value by all values
        var sum = values
            .reduce(function (accum, value) {
                return valuesSumator(accum, value)
            }, zeroValue);
        var centroid = meanValue(sum, count);
        emitter.emit(key, centroid)
    }
};


function run(data, mapper, reducer, formatter) {

    var emitterMap = new Emitter();

    var emitterReduce = new Emitter();

    data.map(function (item, idx) {
        mapper(idx, item, emitterMap);
    });

    emitterMap.keyValues()
        .map(function (pair) {
            reducer(pair[0], pair[1], emitterReduce);
        });

    return formatter(emitterReduce.values())
}


function kmeans(arrayToProcess, Clusters) {

    var Groups = new Array();
    var Centroids = new Array();
    var oldCentroids = new Array();
    var changed = false;

    for (initGroups = 0; initGroups < Clusters; initGroups++) {
        Groups[initGroups] = new Array();
    }


    initialCentroids = Math.round(arrayToProcess.length / (Clusters + 1));

    for (i = 0; i < Clusters; i++) {
        Centroids[i] = arrayToProcess[(initialCentroids * (i + 1))];
    }
    do {

        for (j = 0; j < Clusters; j++) {
            Groups[j] = [];
        }

        changed = false;

        for (i = 0; i < arrayToProcess.length; i++) {
            Distance = -1;
            oldDistance = -1
            for (j = 0; j < Clusters; j++) {
                distance = Math.abs(Centroids[j] - arrayToProcess[i]);
                if (oldDistance == -1) {
                    oldDistance = distance;
                    newGroup = j;
                } else if (distance <= oldDistance) {
                    newGroup = j;
                    oldDistance = distance;
                }

            }
            Groups[newGroup].push(arrayToProcess[i]);
        }

        oldCentroids = Centroids;

        for (j = 0; j < Clusters; j++) {
            total = 0;
            newCentroid = 0;
            for (i = 0; i < Groups[j].length; i++) {
                total += Groups[j][i];
            }

            newCentroid = total / Groups[newGroup].length;

            Centroids[j] = newCentroid;

        }

        for (j = 0; j < Clusters; j++) {
            if (Centroids[j] != oldCentroids[j]) {
                changed = true;
            }

        }

    }

    while (changed == true);

    return Groups;

}

function runJob(job) {
    return run(job.input,
        job.mapper,
        job.reducer,
        job.outputFormatter
    );
}

// var wordCountJob = {
//     input: data,
//     mapper: wordCountMapper,
//     reducer: wordCountReducer,
//     outputFormatter: kvTSVFormatter,
// };


var centers = [
    [52.402281, 31.021566],
    [52.405518, 30.982164],
];

function coordDistance(a, b) {
    return Math.sqrt(a[0] * a[1] + b[0] * b[1])
}

function coordSum(a, b) {
    return [a[0] + b[0], a[1] + b[1]]
}

function coordMean(sum, count) {
    return [sum[0] / count, sum[1] / count]
}

var kmeanPhase1Job = {
    input: data2,
    mapper: kmeanPhase1MapperBuilder(centers, coordDistance),
    reducer: kmeanPhase1ReducerBuilder([0, 0], coordSum, coordMean),
    outputFormatter: function (x) {
        return x
    }
};


var wordCountJob2 = {
    input: data,
    mapper: kMeanPhraseMapper,
    reducer: wordCountReducer,
    outputFormatter: kvTSVFormatter
};


// var wordsCount = runJob(wordCountJob);
// console.log('RESULT:', wordsCount);


var centroids = runJob(kmeanPhase1Job);
console.log('RESULT:', centroids);

// var wordsCount2 = runJob(wordCountJob2);
// console.log('RESULT:', wordsCount2);


// [
//     "45.45,09.123,name ofasfasdf",
//     "45.45,09.123,name ofasfasdf",
//     "45.45,09.123,name ofasfasdf",
//     "45.45,09.123,name ofasfasdf",
// ]