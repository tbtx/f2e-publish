var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {

    var updates = {};

    try {
        updates = require('../json/update.json');
    } catch (e) {}

    res.render('index', {
        updates: updates
    });

});

router.get('/commit', function(req, res) {
    var code = 100,
        msg = 'success';

    res.send({
        code: code,
        msg: msg
    });
});

module.exports = router;
