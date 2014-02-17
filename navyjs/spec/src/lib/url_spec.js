describe('Navy.URL is utility for URL:', function(){
  var url = 'http://example.com/top/index.html?param1=10&param2=20#hash1=100&hash2=200';

  it('can parse hash.', function(){
    var hash = Navy.URL.parseHash(url);
    expect(hash['hash1']).toBe('100');
    expect(hash['hash2']).toBe('200');
  });

  it('can parse none-hash', function(){
    var hash = Navy.URL.parseHash('');
    expect(hash).not.toBeNull();
  });

  it('can stringify hash object', function(){
    var hash = {
      hash1: 100,
      hash2: 20
    };

    var str = Navy.URL.stringifyHash(hash);

    // 本来は順番が保証されないのでちょっと微妙なspecになってしまってる.
    expect(str).toBe('#hash1=100&hash2=20');
  });

  it('can stringify none-hash object', function(){
    var hash = {};

    var str = Navy.URL.stringifyHash(hash);
    expect(str).toBe('');
  });
});
