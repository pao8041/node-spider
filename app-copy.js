var superagent = require("superagent"),
	cheerio = require('cheerio'),
	eventproxy = require("eventproxy");

// 用 superagent 去抓取 https://cnodejs.org/ 的内容
superagent.get('http://www.37.com/')
.end(function (err, sres) {
	// 常规的错误处理
	if (err) {
		return next(err);
	}

	var topicUrls = [],
		ep = new eventproxy();

	// sres.text 里面存储着网页的 html 内容，将它传给 cheerio.load 之后
	// 就可以得到一个实现了 jquery 接口的变量，我们习惯性地将它命名为 `$`
	// 剩下就都是 jquery 的内容了
	var $ = cheerio.load(sres.text);
	var topicUrls = [];
	$('ul.h-list a').each(function (idx, element) {
		var $element = $(element);
		topicUrls.push($element.attr("href"));
	});

	// 命令 ep 重复监听 topicUrls.length 次（在这里也就是 40 次） `topic_html` 事件再行动
	ep.after('topic_html', topicUrls.length, function (topics) {
	  // topics 是个数组，包含了 40 次 ep.emit('topic_html', pair) 中的那 40 个 pair

	  // 开始行动
	  topics = topics.map(function (topicPair) {
	    // 接下来都是 jquery 的用法了
	    var topicUrl = topicPair[0];
	    var topicHtml = topicPair[1];
	    var $ = cheerio.load(topicHtml);
	    return ({
	      title: $('.topic_full_title').text().trim(),
	      href: topicUrl,
	      comment1: $('.reply_content').eq(0).text().trim(),
	    });
	  });

	  console.log('final:');
	  console.log(topics);
	});


	topicUrls.forEach(function (topicUrl) {
	  superagent.get(topicUrl)
	    .end(function (err, res) {
	      console.log('fetch ' + topicUrl + ' successful');
	      ep.emit('topic_html', [topicUrl, res.text]);
	    });
	});


	console.log(topicUrls);
});