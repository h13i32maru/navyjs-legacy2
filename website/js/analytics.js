(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-48365698-1', 'navyjs.org');
ga('send', 'pageview');

// リンクのクリックを個別に軽装する
var trackElements = document.querySelectorAll('a[data-track=true]');
for (var i = 0; i < trackElements.length; i++) {
  var elm = trackElements[i];
  elm.addEventListener('click', function(){
    var category = this.href;
    var action = 'from: ' + location.href;
    var label = this.getAttribute('data-track-label');
    ga('send', 'event', category, action, label);
  });
}
