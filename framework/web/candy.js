class candy{
//     candy: {
//       token: {hash:[], data:false},
//       page: null,
//       actions: {},
//       loader: {elements: {}},
//       interval: {}
//     },
  
//     action: function(arr){
//         if (typeof arr !== 'object') return this.candy.actions
//         this.candy.actions = arr;
//         for (var key in arr) {
//             let val = arr[key];
//             switch (key) {
//             case 'load':
//                 $(function() { val(); });
//                 break;
//             case 'page':
//                 console.log(val)
//                 for (var key2 in val) {
//                     if (key2 == Candy.page()) $(function() {
//                         if(val[key2]) val[key2](Candy.data());
//                         for (var key3 in Candy.candy.interval) {
//                             if(Candy.candy.interval[key3].page){
//                                 console.log(Candy.candy.interval[key3], key2)
//                                 if(Candy.candy.interval[key3].page == key2) Candy.candy.interval[key3]._ = setInterval(Candy.candy.interval[key3].run, Candy.candy.interval[key3].time ?? 1000);
//                                 else if(Candy.candy.interval[key3].page && Candy.candy.interval[key3].page != key2) clearInterval(Candy.candy.interval[key3]._);
//                             }
//                         }
//                     });
//                 }
//                 break;
//             case 'interval':
//                 for (var key2 in val) {
//                     this.candy.interval[key2] = val[key2];
//                     this.candy._ = setInterval(val[key2].run, val[key2].time ?? 1000);
//                 }
//                 break;
//             case 'function', 'candy': break;
//             default:
//                 $.each(val, function(key2, val2) {
//                 if ((typeof val[key2]) == 'function') {
//                     $(document).on(key, key2, val[key2]);
//                 } else {
//                     var func = '';
//                     var split = '';
//                     if (val[key2].includes('.')) split = '.';
//                     else if (val[key2].includes('#')) split = '#';
//                     else if (val[key2].includes(' ')) split = ' ';
//                     func = split != '' ? val[key2].split(split) : [val[key2]];
//                     if (func != '') {
//                     var getfunc = arr;
//                     func.forEach(function(item) {
//                         getfunc = getfunc[item] !== undefined ? getfunc[item] : getfunc[split + item];
//                     });
//                     $(document).on(key, key2, getfunc);
//                     }
//                 }
//                 });
//             }
//       }
//     },
  
  
//     form: function(obj, callback) {
//       if(typeof obj != 'object') obj = { form: obj }
//       $(obj.form).unbind('submit.candy');
//       $(document).off("submit.candy", obj.form);
//       $(document).on("submit.candy", obj.form, function(e){
//         e.preventDefault();
//         let form = $(this);
//         form.find('button, input[type="button"], input[type="submit"]').prop('disabled',true);
//         let actions = Candy.candy.actions
//         actions.candy && actions.candy.form && actions.candy.form.input && actions.candy.form.input.class && actions.candy.form.input.class.invalid  && (
//           form.find(`select.${actions.candy.form.input.class.invalid},input.${actions.candy.form.input.class.invalid},textarea.${actions.candy.form.input.class.invalid}`).removeClass(actions.candy.form.input.class.invalid)
//         )
//         if(obj.messages !== false) {
//           if(obj.messages == undefined || obj.messages == true || obj.messages.includes('error')) form.find('*[candy-form-error]').hide();
//           if(obj.messages == undefined || obj.messages == true || obj.messages.includes('success')) form.find('*[candy-form-success]').hide();
//         }
//         if(form.find('input[type=file]').length > 0){
//           var datastring = new FormData();
//           form.find('input, select, textarea').each(function(index){
//             if($(this).prop('disabled') === false){
//               if($(this).attr('type')=='file') {
//                 datastring.append($(this).attr('name'), $(this).prop('files')[0]);
//               } else if(['checkbox','radio'].includes($(this).attr('type'))) {
//                 if($(this).is(':checked')) datastring.append($(this).attr('name'), $(this).val());
//               } else {
//                 datastring.append($(this).attr('name'), $(this).val());
//               }
//             }
//           });
//           datastring.append('token', Candy.token());
//           var cache = false;
//           var contentType = false;
//           var processData = false;
//         }else{
//           var datastring = form.serialize()+'&token='+Candy.token();
//           var cache = true;
//           var contentType = "application/x-www-form-urlencoded; charset=UTF-8";
//           var processData = true;
//         }
//         $.ajax({
//           type: form.attr('method'),
//           url: form.attr('action'),
//           data: datastring,
//           dataType: "json",
//           contentType: contentType,
//           processData: processData,
//           cache: cache,
//           success: function(data) {
//             if(!data.result) return false
//             if(obj.messages == undefined || obj.messages) {
//               if(data.result.success && (obj.messages == undefined || obj.messages.includes('success') || obj.messages == true)){
//                 if (form.find('*[candy-form-success]').length) form.find('*[candy-form-success]').html(data.result.message).fadeIn();
//                 else form.append(`<span candy-form-success="${obj.form}">${data.result.message}</span>`);
//               }else{
//                 var invalid_input_class = '_candy_error';
//                 var invalid_input_style = '';
//                 var invalid_span_class = '_candy_form_info';
//                 var invalid_span_style = '';
//                 let actions = Candy.candy.actions
//                 if(actions.candy && actions.candy.form){
//                   if(actions.candy.form.input){
//                     if(actions.candy.form.input.class){
//                       if(actions.candy.form.input.class.invalid) invalid_input_class = actions.candy.form.input.class.invalid
//                     }
//                     if(actions.candy.form.input.style){
//                       if(actions.candy.form.input.style.invalid) invalid_input_style = actions.candy.form.input.style.invalid
//                     }
//                   }
//                   if(actions.candy.form.span){
//                     if(actions.candy.form.span.class){
//                       if(actions.candy.form.span.class.invalid) invalid_span_class = actions.candy.form.span.class.invalid
//                     }
//                     if(actions.candy.form.span.style){
//                       if(actions.candy.form.span.style.invalid) invalid_span_style = actions.candy.form.span.style.invalid
//                     }
//                   }
//                 }
//                 $.each(data.errors, function(name, message) {
//                     if(message){
//                         if (form.find(`[candy-form-error="${name}"]`).length) form.find(`[candy-form-error="${name}"]`).html(message).fadeIn();
//                         else form.find('*[name="'+name+'"]').after(`<span candy-form-error="${name}" class="${invalid_span_class}" style="${invalid_span_style}">${message}</span>`);
//                     }
//                     form.find('*[name="'+name+'"]').addClass(invalid_input_class);
//                     form.find('*[name="'+name+'"]').on('focus.candy', function(){
//                         $(this).removeClass(invalid_input_class);
//                         form.find(`[candy-form-error="${name}"]`).fadeOut();
//                         form.find('*[name="'+name+'"]').unbind('focus.candy');
//                     })
//                 });
//               }
//             }
//             if(callback!==undefined){
//               if(typeof callback === "function") callback(data);
//               else if(data.result.success) window.location.replace(callback);
//             }
//           },
//           xhr: function() {
//             var xhr = new window.XMLHttpRequest();
//             xhr.upload.addEventListener("progress", function(evt){
//               if (evt.lengthComputable) {
//                 var percent = parseInt((100 / evt.total) * evt.loaded);
//                 if(obj.loading) obj.loading(percent);
//               }
//             }, false);
//             return xhr;
//           },
//           error: function() {
//             console.error('CandyJS:',"Somethings went wrong...","\nForm: "+obj.form+"\nRequest: "+form.attr('action'));
//           },
//           complete: function() {
//             form.find('button, input[type="button"], input[type="submit"]').prop('disabled',false);
//           }
//         })
//       })
//     },
  
//     load: function(url,callback,push=true){
//       var url_now = window.location.href;
//       if(url.substr(0,4) != 'http') {
//         var domain = url_now.replace('://','{:--}').split('/');
//         domain[0] = domain[0].replace('{:--}','://');
//         if(url.substr(0,1) == '/'){
//           url = domain[0] + url
//         } else {
//           domain[domain.length - 1] = '';
//           url = domain.join('/') + url
//         }
//       }
//       if(url=='' || url.substring(0,11)=='javascript:' || url.includes('#')) return false;
//       $.ajax({
//         url: url,
//         type: "GET",
//         beforeSend: function(xhr){xhr.setRequestHeader('X-CANDY', 'ajaxload');xhr.setRequestHeader('X-CANDY-LOAD', Object.keys(Candy.loader.elements).join(','))},
//         success: function(_data, status, request){
//           if(url != url_now && push) window.history.pushState(null, document.title, url);
//           Candy.candy.page = request.getResponseHeader('x-candy-page');
//           $.each(Candy.loader.elements, function(index, value){
//             $(value).fadeOut(400,function(){
//               $(value).html(_data.output[index]);
//               $(value).fadeIn();
//             });
//           });
//           var _t = setTimeout(function(){
//             if(typeof Candy.candy.actions.load == 'function') Candy.candy.actions.load(Candy.page(),_data.variables);
//             if(Candy.candy.actions.page !== undefined && typeof Candy.candy.actions.page[Candy.candy.page] == "function") Candy.candy.actions.page[Candy.candy.page](Candy.data());
//             if(callback!==undefined) callback(Candy.page(),_data.variables);
//             $("html, body").animate({ scrollTop: 0 });
//           }, 500);
//         },
//         error : function(){
//           window.location.replace(url);
//         }
//       });
//     },
  
//     loader: function(element,arr,callback){
//       this.loader.elements = arr;
//       $(document).on('click',element,function(e){
//         if(e.ctrlKey || e.metaKey) return;
//         var url_now = window.location.href;
//         var url_go = $(this).attr('href');
//         var target = $(this).attr('target');
//         if((target==null || target=='_self') && (url_go!='' && url_go.substring(0,11)!='javascript:' && url_go.substring(0,1)!='#') && (!url_go.includes('://') || url_now.split("/")[2]==url_go.split("/")[2])){
//           e.preventDefault();
//           Candy.load(url_go,callback);
//         }
//       });
//       $(window).on('popstate', function(){
//         Candy.load(window.location.href,callback,false);
//       });
//     }
//   }

    #actions = {};
    #config = {};
    #data = null;
    fn = {};
    #page = null;
    #token = {hash:[], data:false};

    constructor(){
        this.#data = this.data();
    }

    action(obj){
        if(obj.function) for(let func in obj.function) this.fn[func] = obj.function[func];
        if(obj.start) $(function() { obj.start(); });
        if(obj.load){
            if(!this.#actions.load) this.#actions.load = [];
            this.#actions.load.push(obj.load);
            $(function() { obj.load(); });
        }
        if(obj.page){
            if(!this.#actions.page) this.#actions.page = {};
            for(let page in obj.page){
                if(!this.#actions.page[page]) this.#actions.page[page] = [];
                this.#actions.page[page].push(obj.page[page]);
                if(this.page() == page) $(function() { obj.page[page](); });
            }
        }
        if(obj.interval){
            if(!this.#actions.interval) this.#actions.interval = {};
            for(let interval in obj.interval){
                this.#actions.interval[interval] = obj.interval[interval];
                if(obj.interval[interval].page && obj.interval[interval].page != this.page()) continue;
                this.#actions.interval[interval]._ = setInterval(obj.interval[interval].function, obj.interval[interval].interval ?? 1000);
            }
        }
    }

    client(){
      if(!document.cookie.includes('candy_client=')) return null;
      return document.cookie.split('candy_client=')[1].split(';')[0];
    }

    data(){
        if(this.#data) return this.#data;
        if(!document.cookie.includes('candy_data=')) return null;
        return JSON.parse(unescape(document.cookie.split('candy_data=')[1].split(';')[0]));
    }

    get(url,callback){
        url = url + '?_token=' + this.token();
        $.get(url, callback);
    }

    page(){
        if(!this.#page){
            let data = this.data();
            if(data !== null) this.#page = data.page;
            else this.token(true);
        }
        return this.#page;
    }

    storage(key,value){
        if(value === undefined) return localStorage.getItem(key);
        else if(value === null) return localStorage.removeItem(key);
        else localStorage.setItem(key,value);
    }

    token(){
        let data = this.data();
        if(!this.#token.listener){
            this.#token.listener = $(document).ajaxSuccess(function(res,xhr,req){
                if(req.url.substr(0,4) == 'http') return false;
                try {
                    let token = xhr.getResponseHeader("X-Candy-Token");
                    if(token) this.#token.hash.push(token);
                    if(this.#token.hash.length > 2) this.#token.hash.shift();
                } catch (e) {
                    return false;
                }
            });
        }
        if(!this.#token.hash.length){
            if(!this.#token.data && data) {
                this.#page = data.page;
                this.#token.hash.push(data.token);
                this.#token.data = true;
            } else {
                var req = new XMLHttpRequest();
                req.open('GET', '/', false);
                req.setRequestHeader('X-Candy', 'token');
                req.setRequestHeader('X-Candy-Client', this.client());
                req.send(null);
                var req_data = JSON.parse(req.response);
                if(req_data.token) this.#token.hash.push(req_data.token);
            }
        }
        this.#token.hash.filter(n => n);
        var return_token = this.#token.hash.shift();
        if(!this.#token.hash.length) $.ajax({
            url: '/',
            type: 'GET',
            headers: { 'X-Candy': 'token', 'X-Candy-Client': this.client()},
            success: (data) => {
                var result = JSON.parse(JSON.stringify(data));
                if(result.token) this.#token.hash.push(result.token);
            }
        });
        return return_token;
    }

}

const Candy = new candy();