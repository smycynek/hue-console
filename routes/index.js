var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  var homepageData = {
      title : 'Server Template', 
      projectName : 'Hue Console', 
      projectUrl : './hueConsole/'
  };
  res.render('index', homepageData);
});

module.exports = router;
