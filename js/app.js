var app = new Framework7({
  // App root element
  root: '#app',
  // App Name
  name: 'My App',
  // App id
  id: 'com.myapp.test',
  // Enable swipe panel
  panel: {
    swipe: 'left',
  },
  // Add default routes
  routes: [{
    path: '/about/',
    url: 'about.html',
  }, ],

});

var $$ = Dom7;

var mainView = app.views.create('.view-main');
var kol = 50;

// Создание отсортированного массива на основе json
function generateSortArray(currencyFromCM) {
  var array = [];
  for (var i in currencyFromCM.data) {
    array.push(currencyFromCM.data[i]);
  }
  return array.sort(function(a,b) {return a.rank - b.rank})
}

// Создание списка выбора валют
function addListCurrency(arraySelected) {
  var str = ""; // html-код для списка
  str += 
    '<div class="fab fab-right-bottom fab-morph" id="addCurrency">' +
    '<a class="item-link smart-select" id="listCurrency" data-open-in="popup"  data-searchbar="true" data-searchbar-placeholder="Поиск">' +
    '<select name="Currency" multiple id="cur">' +
    '</select>' +
    '<div class="item-content">' +
    ' <div class="item-inner">' +
    ' <div class="item-title"><font size="5">+</font></div>' +
    '</div></div></a></div>';
  document.getElementById('blockTab1').innerHTML += str;

    // Создается сам список для выбора валют
    app.request.get('https://api.coinmarketcap.com/v2/ticker/?limit='+kol, function(data1) {
      var currencyFromCM = JSON.parse(data1);
      console.log('request for smart-select:\n', currencyFromCM);
      var sortArrayCurrency = generateSortArray(currencyFromCM); // отсортированные по rank элементы
      for (var i in sortArrayCurrency) {
        if (arraySelected.includes(sortArrayCurrency[i].name)) // 
          document.getElementById('cur').innerHTML += '<option value="' + sortArrayCurrency[i].name +
           '" selected data-option-image="icons32/' + sortArrayCurrency[i].symbol.toLowerCase() + '.png">' + sortArrayCurrency[i].name + '</option>';
        else 
          document.getElementById('cur').innerHTML += '<option value="' + sortArrayCurrency[i].name +
           '"data-option-image="icons32/' + sortArrayCurrency[i].symbol.toLowerCase() + '.png">' + sortArrayCurrency[i].name + '</option>';
      }
      console.log('list generated');
    })
}

// Добавление аккордион элементов, arrayCurrency == null в случае первого входа
// key - true - cache, false - not cache
function addAccordion(sortArrayCurrency, arraySelected) {
  var str = "";           // html-код
  for (var i in sortArrayCurrency) { 
    if (arraySelected.includes(sortArrayCurrency[i].name))
      str +=
        '<div class="accordion-item">' +
        '<a href="#" class="no-fastclick item-content item-link">' +
        '<div class="item-media">' + '<img src="icons128/' + sortArrayCurrency[i].symbol.toLowerCase() + '.png" width="35" height="35">' + '</div>' +
        '<div class="item-inner">' +
        '<div class="item-title">' +  sortArrayCurrency[i].name + '</div>' +
        '<div class="item-after" id="' +  sortArrayCurrency[i].name + '"> $' + sortArrayCurrency[i].quotes.USD.price + '</div>' +
        '</div>' +
        '</a>' +
        '<div class="accordion-item-content">' +
        '<div class="block">' +
        '<p>Доп инфа</p>' +
        '</div>' +
        '</div>' +
        '</div>';
  }
  document.getElementById('mainList').innerHTML = str;
  console.log('accordion items added');
}

// Загрузка списка валют из кеша
function loadFromCache() {
   var cache = JSON.parse(localStorage.getItem('cacheCurrency'));
   var arraySelected = []; // Нужны имена для обновления цен
   for (var i in cache) arraySelected.push(cache[i].name);
   app.request.get('https://api.coinmarketcap.com/v2/ticker/?limit='+kol, function(data1) {
   var currencyFromCM = JSON.parse(data1);
   var sortArrayCurrency = generateSortArray(currencyFromCM); // отсортированные по rank элементы
   var j = 0; 
   for (var i in sortArrayCurrency) {
    if (arraySelected.includes(sortArrayCurrency[i].name)) { // свежий курс
     cache[j++].price = sortArrayCurrency[i].quotes.USD.price;
    }
   }
   addAccordion(sortArrayCurrency, arraySelected); 
   addListCurrency(arraySelected); // Добавление их в список выбора с галочкой
   })
}

// начальная инициализация списка валют
function initializeData(el) { 
  var cache = JSON.parse(localStorage.getItem('cacheCurrency'));
  console.log('Cache data: ', cache);
  if (cache == null) { // Если кэша нет, то получаем 5 самых популярных
    app.request.get('https://api.coinmarketcap.com/v2/ticker/?limit=5', function(data1) {
      var currencyFromCM = JSON.parse(data1);
      generateSortArray(currencyFromCM)
      console.log('no cache => get top 5 currency: \n', currencyFromCM);
      var arraySelected = []; // отмеченные галочкой в списке выбора валют
      var sortArrayCurrency = generateSortArray(currencyFromCM); // отсортированные по rank элементы
      for (var i in currencyFromCM.data) {
         arraySelected.push(currencyFromCM.data[i].name);
       }
      addAccordion(sortArrayCurrency, arraySelected); // Добавление валют на главный экран
      addListCurrency(arraySelected); // Добавление их в список выбора с галочкой
      saveCacheListCurrency(sortArrayCurrency, arraySelected);
    });
  } 
  else {
    loadFromCache();
  }
}

// Костыль для кнопочки с плюсом
app.on('smartSelectOpen', function(el) {
  var listCurrency = $$('#listCurrency').find('.item-after').html();
  if (listCurrency != 0) $$('#listCurrency').find('.item-after').html('');
})

// Генерация массива выбранных в смарт-селект валют 
function generateArrayCurrency(listCurrency) {
  var arrayCurrency = []; // Хранит все выбранные валюты
  var tmp = ""; // для записи в массив
  for (var i = 0; i < listCurrency.length; i++) {
    if (listCurrency[i] != ',') 
      tmp += listCurrency[i];
    else {
      arrayCurrency.push(tmp);
      tmp = "";
      i++;
    }
  }
  if (tmp != "") arrayCurrency.push(tmp);
  return arrayCurrency;
}

// Реагирует на закрытие смарт-селекта, обновляет список валют на экране
app.on('smartSelectClose', function(el) { // Событие, реагирующее на начало анимации закрытия выбора валют
  var selectedCurrency = $$('#listCurrency').find('.item-after').html() // Хранит строку выбранных валют в виде Bitcoin, Ripple, ...
  console.log(selectedCurrency)
  var arraySelected = generateArrayCurrency(selectedCurrency);
  if (arraySelected.length != 0) {
    app.request.get('https://api.coinmarketcap.com/v2/ticker/?limit='+kol, function(data1) {
      var currencyFromCM = JSON.parse(data1);
      console.log('Result request:', currencyFromCM);
      var sortArrayCurrency = generateSortArray(currencyFromCM);
      addAccordion(sortArrayCurrency, arraySelected); 
      $$('#listCurrency').find('.item-after').html('')
      saveCacheListCurrency(sortArrayCurrency, arraySelected);
    })
  }
  else {
    //document.getElementById('mainList').innerHTML = '';
  }
})

// Кеширование списка валют
function saveCacheListCurrency(sortArrayCurrency, arraySelected) {
  var cacheCurrency = []; // Добавляем их в кеш
      for (var i in sortArrayCurrency) {
        if (arraySelected.includes(sortArrayCurrency[i].name)) {
          var formData = {
            'name': sortArrayCurrency[i].name,
            'symbol': sortArrayCurrency[i].symbol,
            'price': sortArrayCurrency[i].quotes.USD.price
          }
          cacheCurrency.push(formData);
        }
      }
      localStorage.setItem('cacheCurrency', JSON.stringify(cacheCurrency));
}


initializeData()



$$('#but1').click(function() {
  var formData = app.form.convertToData('#myform');
  console.log(formData);
  localStorage.setItem('a', JSON.stringify(formData))
})

$$('#but2').click(function() {
  var tmp = JSON.parse(localStorage.getItem('a'));
  console.log(tmp);
  var formData = {
    'name': tmp.name,
    'surname': tmp.surname,
  }
  app.form.fillFromData('#myform', formData);
})


function updatePrice() {
   var cache = JSON.parse(localStorage.getItem('cacheCurrency'));
   var arraySelected = []; // Нужны имена для обновления цен
   for (var i in cache) arraySelected.push(cache[i].name);
   app.request.get('https://api.coinmarketcap.com/v2/ticker/?limit='+kol, function(data1) {
   var currencyFromCM = JSON.parse(data1);
   var sortArrayCurrency = generateSortArray(currencyFromCM); // отсортированные по rank элементы
   var j = 0; 
   for (var i in sortArrayCurrency) {
    if (arraySelected.includes(sortArrayCurrency[i].name)) { // свежий курс
     cache[j++].price = sortArrayCurrency[i].quotes.USD.price;
    }
   }
   addAccordion(sortArrayCurrency, arraySelected); 
   })
}

var ptrContent = $$('#tab-1');
// Add 'refresh' listener on it
ptrContent.on('ptr:refresh', function (e) {
  app.progressbar.show('white');
  updatePrice();
  setTimeout(function() {
    app.progressbar.hide();
  }, 700);
  app.ptr.done()
});