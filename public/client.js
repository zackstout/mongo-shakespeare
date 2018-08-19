
function handleSub() {
  $.ajax({
    type: 'POST',
    url: '/word',
    data: {
      word: $('#word_search').val()
    },
    success: function(data) {
      console.log(data);
      $('.output').empty();
      data.forEach(d => {
        $('.output').append(`<div>
          <p>${d.line_no}</p>
          <p>${d.speaker}</p>
          <p>${d.text}</p>
          </div>`);
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

  // Testing speaker route:
  $.ajax({
    type: 'GET',
    url: '/personality',
    success: function(data) {
      console.log(data);
    }
  });
});
