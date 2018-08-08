
function handleSub() {
  console.log($('#word_search').val());

  $('.output').empty();

  $.ajax({
    type: 'POST',
    url: '/word',
    data: {
      word: $('#word_search').val()
    },
    success: function(data) {
      console.log(data);
      data.forEach(d => {
        $('.output').append(`<p>${d.text}</p>`);

      });

      $('#word_search').val('');
      $('#word_search').focus();

    }
  });
}

$(document).ready(() => {

  $('#word_search').focus();

  $('#word_search_sub').on('click', () => {
    handleSub();
  });

  window.onkeydown = function(e) {
    if (e.keyCode == 13) {
      handleSub();
    }
  };

});
