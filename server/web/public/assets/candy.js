const Candy = {
    candy: {
      token: {hash:[], data:false},
      page: null,
      actions: {},
      loader: {elements: {}}
    },
  
    action: function(arr){
      if (typeof arr !== 'object') return this.candy.actions
      this.candy.actions = arr;
      $.each(arr, function(key, val) {
        switch (key) {
          case 'load':
            $(function() { val(); });
            break;
          case 'page':
            $.each(val, function(key2, val2) {
              if (key2 == Candy.page()) $(function() { val2(Candy.data()); });
            });
            break;
          case 'start':
            $(function() { val(); });
            break;
          case 'interval':
            $.each(val, function(key2, val2) {
              $(function() {
                var _i = setInterval(function() {
                  val2();
                }, key2);
              });
            });
            break;
          case 'function', 'candy': break;
          default:
            $.each(val, function(key2, val2) {
              if ((typeof val[key2]) == 'function') {
                $(document).on(key, key2, val[key2]);
              } else {
                var func = '';
                var split = '';
                if (val[key2].includes('.')) split = '.';
                else if (val[key2].includes('#')) split = '#';
                else if (val[key2].includes(' ')) split = ' ';
                func = split != '' ? val[key2].split(split) : [val[key2]];
                if (func != '') {
                  var getfunc = arr;
                  func.forEach(function(item) {
                    getfunc = getfunc[item] !== undefined ? getfunc[item] : getfunc[split + item];
                  });
                  $(document).on(key, key2, getfunc);
                }
              }
            });
        }
      });
    },

    client: function(){
      if(!document.cookie.includes('candy_client=')) return null;
      return document.cookie.split('candy_client=')[1].split(';')[0];
    },


    data: function(){
      if(!document.cookie.includes('candy_data=')) return null;
      return JSON.parse(unescape(document.cookie.split('candy_data=')[1].split(';')[0]));
    },
  
    form: function(obj, callback) {
      if(typeof obj != 'object') obj = { form: obj }
      $(obj.form).unbind('submit.candy');
      $(document).off("submit.candy", obj.form);
      $(document).on("submit.candy", obj.form, function(e){
        e.preventDefault();
        let form = $(this);
        form.find('button, input[type="button"], input[type="submit"]').prop('disabled',true);
        let actions = Candy.candy.actions
        actions.candy && actions.candy.form && actions.candy.form.input && actions.candy.form.input.class && actions.candy.form.input.class.invalid  && (
          form.find(`select.${actions.candy.form.input.class.invalid},input.${actions.candy.form.input.class.invalid},textarea.${actions.candy.form.input.class.invalid}`).removeClass(actions.candy.form.input.class.invalid)
        )
        if(obj.messages !== false) {
          if(obj.messages == undefined || obj.messages == true || obj.messages.includes('error')) form.find('*[candy-form-error]').hide();
          if(obj.messages == undefined || obj.messages == true || obj.messages.includes('success')) form.find('*[candy-form-success]').hide();
        }
        if(form.find('input[type=file]').length > 0){
          var datastring = new FormData();
          form.find('input, select, textarea').each(function(index){
            if($(this).prop('disabled') === false){
              if($(this).attr('type')=='file') {
                datastring.append($(this).attr('name'), $(this).prop('files')[0]);
              } else if(['checkbox','radio'].includes($(this).attr('type'))) {
                if($(this).is(':checked')) datastring.append($(this).attr('name'), $(this).val());
              } else {
                datastring.append($(this).attr('name'), $(this).val());
              }
            }
          });
          datastring.append('token', Candy.token());
          var cache = false;
          var contentType = false;
          var processData = false;
        }else{
          var datastring = form.serialize()+'&token='+Candy.token();
          var cache = true;
          var contentType = "application/x-www-form-urlencoded; charset=UTF-8";
          var processData = true;
        }
        $.ajax({
          type: form.attr('method'),
          url: form.attr('action'),
          data: datastring,
          dataType: "json",
          contentType: contentType,
          processData: processData,
          cache: cache,
          success: function(data) {
            if(!data.success) return false
            if(obj.messages == undefined || obj.messages) {
              if(data.success.result && (obj.messages == undefined || obj.messages.includes('success') || obj.messages == true)){
                if (form.find('*[candy-form-success]').length) form.find('*[candy-form-success]').html(data.success.message).fadeIn();
                else form.append(`<span candy-form-success="${obj.form}">${data.success.message}</span>`);
              }else{
                var invalid_input_class = '_candy_error';
                var invalid_input_style = '' //'border-color:red';
                var invalid_span_class = '_candy_form_info';
                var invalid_span_style = '' //'color:red';
                let actions = Candy.candy.actions
                if(actions.candy && actions.candy.form){
                  if(actions.candy.form.input){
                    if(actions.candy.form.input.class){
                      if(actions.candy.form.input.class.invalid) invalid_input_class = actions.candy.form.input.class.invalid
                    }
                    if(actions.candy.form.input.style){
                      if(actions.candy.form.input.style.invalid) invalid_input_style = actions.candy.form.input.style.invalid
                    }
                  }
                  if(actions.candy.form.span){
                    if(actions.candy.form.span.class){
                      if(actions.candy.form.span.class.invalid) invalid_span_class = actions.candy.form.span.class.invalid
                    }
                    if(actions.candy.form.span.style){
                      if(actions.candy.form.span.style.invalid) invalid_span_style = actions.candy.form.span.style.invalid
                    }
                  }
                }
                $.each(data.errors, function(name, message) {
                  if (form.find(`[candy-form-error="${name}"]`).length) form.find(`[candy-form-error="${name}"]`).html(message).fadeIn();
                  else form.find('*[name="'+name+'"]').after(`<span candy-form-error="${name}" class="${invalid_span_class}" style="${invalid_span_style}">${message}</span>`);
                  form.find('*[name="'+name+'"]').addClass(invalid_input_class);
                  form.find('*[name="'+name+'"]').on('focus.candy', function(){
                    $(this).removeClass(invalid_input_class);
                    form.find(`[candy-form-error="${name}"]`).fadeOut();
                    form.find('*[name="'+name+'"]').unbind('focus.candy');
                  })
                });
              }
            }
            if(callback!==undefined){
              if(typeof callback === "function") callback(data);
              else if(data.success.result) window.location.replace(callback);
            }
          },
          xhr: function() {
            var xhr = new window.XMLHttpRequest();
            xhr.upload.addEventListener("progress", function(evt){
              if (evt.lengthComputable) {
                var percent = parseInt((100 / evt.total) * evt.loaded);
                if(obj.loading) obj.loading(percent);
              }
            }, false);
            return xhr;
          },
          error: function() {
            console.error('CandyJS:',"Somethings went wrong...","\nForm: "+obj.form+"\nRequest: "+form.attr('action'));
          },
          complete: function() {
            form.find('button, input[type="button"], input[type="submit"]').prop('disabled',false);
          }
        })
      })
    },
  
    token: function(){
      var data = Candy.data();
      if(!Candy.candy.token.listener){
        Candy.candy.token.listener = $(document).ajaxSuccess(function(res,xhr,req){
          if(req.url.substr(0,4) == 'http') return false;
          try {
            let token = xhr.getResponseHeader("X-Candy-Token");
            if(token) Candy.candy.token.hash.push(token);
            if(Candy.candy.token.hash.length > 2) Candy.candy.token.hash.shift();
          } catch (e) {
            return false;
          }
        });
      }
      if(!Candy.candy.token.hash.length){
        if(!Candy.candy.token.data && data) {
          Candy.candy.page = data.candy.page;
          Candy.candy.token.hash.push(data.candy.token);
          Candy.candy.token.data = true;
        } else {
          var req = new XMLHttpRequest();
          req.open('GET', '/', false);
          req.setRequestHeader('X-Candy', 'token');
          req.setRequestHeader('X-Candy-Client', this.client());
          req.send(null);
          var req_data = JSON.parse(req.response);
          Candy.candy.page = req_data.page;
          if(req_data.token) Candy.candy.token.hash.push(req_data.token);
        }
      }
      Candy.candy.token.hash.filter(n => n);
      var return_token = Candy.candy.token.hash.shift();
      if(!Candy.candy.token.hash.length) $.ajax({
        url: '/',
        type: 'GET',
        headers: { 'X-Candy': 'token', 'X-Candy-Client': this.client()},
        success: function (data) {
          var result = JSON.parse(JSON.stringify(data));
          if(result.token) Candy.candy.token.hash.push(result.token);
          Candy.candy.page = result.page;
        }
      });
      return return_token;
    },
  
    page: function(){
      if(!Candy.candy.page){
        let data = Candy.data();
        if(data !== null) Candy.candy.page = data.candy.page;
        else Candy.token(true);
      }
      return Candy.candy.page;
    },
  
    load: function(url,callback,push=true){
      var url_now = window.location.href;
      if(url.substr(0,4) != 'http') {
        var domain = url_now.replace('://','{:--}').split('/');
        domain[0] = domain[0].replace('{:--}','://');
        if(url.substr(0,1) == '/'){
          url = domain[0] + url
        } else {
          domain[domain.length - 1] = '';
          url = domain.join('/') + url
        }
      }
      if(url=='' || url.substring(0,11)=='javascript:' || url.includes('#')) return false;
      $.ajax({
        url: url,
        type: "GET",
        beforeSend: function(xhr){xhr.setRequestHeader('X-CANDY', 'ajaxload');xhr.setRequestHeader('X-CANDY-LOAD', Object.keys(Candy.loader.elements).join(','))},
        success: function(_data, status, request){
          if(url != url_now && push) window.history.pushState(null, document.title, url);
          Candy.candy.page = request.getResponseHeader('x-candy-page');
          $.each(Candy.loader.elements, function(index, value){
            $(value).fadeOut(400,function(){
              $(value).html(_data.output[index]);
              $(value).fadeIn();
            });
          });
          var _t = setTimeout(function(){
            if(typeof Candy.candy.actions.load == 'function') Candy.candy.actions.load(Candy.page(),_data.variables);
            if(Candy.candy.actions.page !== undefined && typeof Candy.candy.actions.page[Candy.candy.page] == "function") Candy.candy.actions.page[Candy.candy.page](Candy.data());
            if(callback!==undefined) callback(Candy.page(),_data.variables);
            $("html, body").animate({ scrollTop: 0 });
          }, 500);
        },
        error : function(){
          window.location.replace(url);
        }
      });
    },
  
    loader: function(element,arr,callback){
      this.loader.elements = arr;
      $(document).on('click',element,function(e){
        if(e.ctrlKey || e.metaKey) return;
        var url_now = window.location.href;
        var url_go = $(this).attr('href');
        var target = $(this).attr('target');
        if((target==null || target=='_self') && (url_go!='' && url_go.substring(0,11)!='javascript:' && url_go.substring(0,1)!='#') && (!url_go.includes('://') || url_now.split("/")[2]==url_go.split("/")[2])){
          e.preventDefault();
          Candy.load(url_go,callback);
        }
      });
      $(window).on('popstate', function(){
        Candy.load(window.location.href,callback,false);
      });
    }
  }