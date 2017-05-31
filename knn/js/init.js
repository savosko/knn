var getData = function (cb) {
    // readData('gendata_1K.txt', function (data) {
    readData('devs_1K.txt', function (data) {
        cb({ "data": data})
    });

};

var readData = function (file, cb) {
    var rawFile = new XMLHttpRequest();
    var result = [];
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function () {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                var allText = rawFile.responseText;
                var formatText = allText.split("\n");
                $.each(formatText, function (k, v) {
                    var obj = JSON.parse(v);
                    result.push(obj);
                });
                cb(result);
            }
        }
    }
    rawFile.send(null);
};

var run = function (kInput) {

	var homes = new KNN.ItemList(kInput);

	getData(function (json) {
        $.each(json.data, function (k,v) {
            homes.add( new KNN.Item(v) );
        });
        console.log('JSON:', json);
        //REALTY
        var random_rooms = Math.round( Math.random() * 10 );
        // var random_area = Math.round( Math.random() * 250 );
        //DEVS
        var random_area = Math.round( Math.random() * 2500 );

        homes.add( new KNN.Item({quantity: random_rooms, size: random_area, type: false}) );
        homes.determineUnknown();
        homes.draw("homes");
    });



		
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

var _run = function(data, mapper, reducer, formatter) {

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
};

var sampleData = [
    {quantity: 4, size: 10, type: 'flat'},
    {quantity: 5, size: 12, type: 'flat'},
    {quantity: 6, size: 11, type: 'house'},
    {quantity: 2, size: 10, type: 'flat'},
    {quantity: 3, size: 15, type: 'house'},
    {quantity: 3, size: 16, type: 'apartment'},
    {quantity: 1, size: 17, type: 'apartment'}
];

var knnMapper = function () {
    //TODO knnMapper;
};

var knnReducer = function () {
    //TODO knnReducer;
};


var knnJob = {
    input: sampleData,
    mapper: knnMapper('', ''),
    reducer: knnReducer('', '', ''),
    outputFormatter: function (x) {
        return x
    }
};

function runJob(job) {
    return _run(job.input,
        job.mapper,
        job.reducer,
        job.outputFormatter
    );
}

var results = runJob(knnJob);
console.log('Results: ', results);

$("button#run").click(function () {
	var $input = $('#kInput').val();
	run($input); 
});