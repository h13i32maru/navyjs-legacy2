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

});
