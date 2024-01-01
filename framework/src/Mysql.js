'use strict';
const mysql = require('mysql');

class Raw {
  constructor(query){
    this.query = query;
  }
  raw(){
    return this.query;
  }
}

class Table {
  arr = [];
  result = [];
  table;
  conn;
  statements = ['=','>','>=','<','<=','!=','LIKE','NOT LIKE','IN','NOT IN','BETWEEN','NOT BETWEEN','IS','IS NOT'];
  // protected $val_statements = ['IS NULL','IS NOT NULL'];

  constructor(table, conn){
    this.conn  = conn;
    this.arr.table = table;
    if(!this.table) this.table = [];
    this.define(table);
  }

  run(type = null){
    const arr_q = ['inner join', 'right join', 'left join', 'where','group by','having','order by','limit'];
    let query = "";
    for(let key of arr_q) {
      if(this.arr[key]){
        if(Array.isArray(this.arr[key])){
          query += " " + key.toUpperCase() + " " + this.arr[key].join(" " + strtoupper(key) + " ");
        }else{
          query += " " + key.toUpperCase() + " ";
          query += this.arr[key];
        }
      }
    }
    switch(type){
      case 'get':    query = `SELECT ${this.arr.select ? this.arr.select : '*'} FROM ${this.escape(this.arr.table,'table')} ${query}`; break;
      case 'set':    query = `UPDATE ${this.escape(this.arr['table'],'table')} SET ${this.arr['set']} ${query}`; break;
      case 'insert': query = `INSERT ${this.arr.ignore ? 'IGNORE' : ''} INTO ${this.escape(this.arr.table,'table')} ${this.arr.into} VALUES ${this.arr.values}`; break;
      // if($type == 'delete')   return $this->query = "DELETE FROM ".$this->escape($this->arr['table'],'table')." ".$query;
      // if($type == 'replace')  return $this->query = "REPLACE INTO ".$this->escape($this->arr['table'],'table').' '.$this->arr['into'].' VALUES '.$this->arr['values'].'';
    }
    console.log(query);
    return new Promise((resolve, reject) => {
      if(!query) return false;
      this.conn.query(query, (err, result) => {
        if(err) return reject(err);
        return resolve(result);
      });
    });
    return this;
  }

  where(...args){
    if(args.length == 1 && !['array','object'].includes(typeof args[0])){
      console.log(this.table[this.arr.table])
      this.arr.where = this.whereExtract([this.table[this.arr.table].primary, args[0]]);
    }else if(args.length > 0){
      this.arr.where = this.arr.where && this.arr.where.trim() != '' ? `${this.arr.where} AND ${this.whereExtract(args)}` : this.whereExtract(args);
    }
    return this;
  }
//     function having(){
//       if(count(func_get_args()) == 1 && !is_array(func_get_args()[0])){
//         $this->arr['having'] = is_numeric(func_get_args()[0]) ? "id='".func_get_args()[0]."'" : "";
//       }elseif(count(func_get_args()) > 0){
//         $this->arr['having'] = isset($this->arr['having']) && trim($this->arr['having'])!='' ? $this->arr['having'].' AND '.$this->whereExtract(func_get_args()) : $this->whereExtract(func_get_args());
//       }
//       return new static($this->table,$this->arr);
//     }
//     function orWhere(){
//       if(count(func_get_args()) > 0){
//         $this->arr['where'] = isset($this->arr['where']) && trim($this->arr['where'])!='' ? $this->arr['where'].' OR '.$this->whereExtract(func_get_args()) : $this->whereExtract(func_get_args());
//       }
//       return new static($this->table,$this->arr);
//     }
//     function whereJson($col,$val){
//       //return 'JSON_SEARCH('.$col.', "one", "'.$val.'") IS NOT NULL';
//       return new static($this->table,$this->arr);
//     }
//     function cache($t=3600){
//       if(!is_numeric($t)){
//         $exp = explode(' ',str_replace('  ',' ',$t));
//         if($exp[1] == 'second') $t = intval(trim($exp[0]));
//         if($exp[1] == 'minute') $t = intval(trim($exp[0])) * 60;
//         if($exp[1] == 'hour')   $t = intval(trim($exp[0])) * 60 * 60;
//         if($exp[1] == 'day')    $t = intval(trim($exp[0])) * 60 * 60 * 24;
//         if($exp[1] == 'week')   $t = intval(trim($exp[0])) * 60 * 60 * 24 * 7;
//         if($exp[1] == 'month')  $t = intval(trim($exp[0])) * 60 * 60 * 24 * 30;
//         if($exp[1] == 'year')   $t = intval(trim($exp[0])) * 60 * 60 * 24 * 365;
//       }
//       $this->arr['cache'] = $t;
//       return new static($this->table,$this->arr);
//     }
  get(b){
    return new Promise((resolve,reject)=>{
      if(!b) b = false;
      let query = this.run('get');
      let data = [];
      // if(isset($this->arr['cache'])){
      //   $md5_query = md5($query);
      //   $md5_table = md5($this->arr['table']);
      //   $file = "cache/mysql/".md5(Mysql::$name)."/$md5_table"."_$md5_query";
      //   $cache = Candy::storage($file)->get('cache');
      //   if(isset($cache->date) && ($cache->date >= (time() - $this->arr['cache']))) return $cache->data;
      // }
      // $sql = mysqli_query(Mysql::$conn, $query);
      // if($sql === false) return $this->error();
      // while($row = mysqli_fetch_assoc($sql)){
      //   foreach($row as $key => $value) $row[$key] = $this->type($key, $value);
      //   $data[] = $b ? $row : (object)$row;
      // }
      // mysqli_free_result($sql);
      // if(isset($cache)){
      //   $cache->data = $data;
      //   $cache->date = time();
      //   Candy::storage($file)->set('cache', $cache);
      // }
      return resolve(query);
    });
  }
//     function delete($b=false){
//       $query = $this->query('delete');
//       $sql = mysqli_query(Mysql::$conn, $query);
//       $this->affected = mysqli_affected_rows(Mysql::$conn);
//       if($this->affected > 0) self::clearcache();
//       return new static($this->table,$this->arr, ['affected' => $this->affected]);
//     }
//     function rows($b=false){
//       $query = $this->query('get');
//       if(isset($this->arr['cache'])){
//         $md5_query = md5($query);
//         $md5_table = md5($this->arr['table']);
//         $file = "cache/mysql/".md5(Mysql::$name)."/$md5_table"."_$md5_query"."_r";
//         $cache = Candy::storage($file)->get('cache');
//         if(isset($cache->date) && ($cache->date >= (time() - $this->arr['cache']))) return $cache->data;
//       }
//       $sql = mysqli_query(Mysql::$conn, $query);
//       if($sql === false) return $this->error();
//       $rows = mysqli_num_rows($sql);
//       if(isset($cache)){
//         $cache->data = $rows;
//         $cache->date = time();
//         Candy::storage($file)->set('cache', $cache);
//       }
//       return $sql===false ? false : $rows;
//     }
  set(arr, val){
    let vars = '';
    if(!['array','object'].includes(typeof arr) && val !== undefined) vars += this.escape(arr,'col') + ' = ' + this.escape(this.type(arr, val, 'encode')) + ',';
    else for(let [key, value] of Object.entries(arr)) vars += this.escape(key,'col') + ' = ' + this.escape(this.type(key, value, 'encode')) + ',';
    this.arr.set = vars.substring(0, vars.length - 1);
    let query = this.run('set');
//       if($sql === false) return $this->error();
//       $this->affected = mysqli_affected_rows(Mysql::$conn);
//       if($this->affected > 0) self::clearcache();
//       return new static($this->table,$this->arr, ['affected' => $this->affected]);
  }

  insert(arr){
      return new Promise((resolve, reject) => {
        this.id = 1;
        let ext = this.valuesExtract(arr);
        this.arr['into'] = ext['into'];
        this.arr['values'] = ext['values'];
        let query = this.run('insert');
      //   if($sql === false) return $this->error();
      //   $this->success = $sql;
      //   $this->id = mysqli_insert_id(Mysql::$conn);
        // $this->affected = mysqli_affected_rows(Mysql::$conn);
        // if(this.affected > 0) this.clearcache();
        return this;
      });
  }

  insertIgnore(arr){
    this.arr.ignore = true;
    return this.insert(arr);
  }

//     function replace($arr){
//       $this->id = 1;
//       $ext = $this->valuesExtract($arr);
//       $this->arr['into'] = $ext['into'];
//       $this->arr['values'] = $ext['values'];
//       $query = $this->query('replace');
//       $sql = mysqli_query(Mysql::$conn, $query);
//       if($sql === false) return $this->error();
//       $this->success = $sql;
//       $this->id = mysqli_insert_id(Mysql::$conn);
//       self::clearcache();
//       return new static($this->table,$this->arr, ['id' => $this->id]);
//     }

  first (b = false ){
    this.arr.limit =  1;
    let sql = this.get(b);
    if(sql === false || sql[0]) return false;
    return sql[0];
  }

//     function first($b=false){
//       $this->arr['limit'] = 1;
//       $sql = $this->get($b);
//       if($sql === false || !isset($sql[0])) return false;
//       return $sql[0];
//     }
//     function select(){
//       $this->arr['select'] = isset($this->arr['select']) ? $this->arr['select'] : '';
//       $select = array_filter(explode(',',$this->arr['select']));
//       if(count(func_get_args())==1 && is_array(func_get_args()[0])){
//         if(isset(func_get_args()[0]['ct']) && isset(func_get_args()[0]['v']) && func_get_args()[0]['ct'] == $GLOBALS['candy_token_mysql']){
//           $select[] = func_get_args()[0]['v'];
//         }else{
//           foreach(func_get_args()[0] as $key => $value){
//             if(!is_int($key)) $select[] = $this->escape($key,'col').' AS '.$this->escape($value);
//             else $select[] = $this->escape($value,'col');
//           }
//         }
//       }else{
//         foreach(func_get_args() as $key){
//           $select[] = $this->escape($key,'col');
//         }
//       }
//       $this->arr['select'] = implode(', ',$select);
//       return new static($this->table,$this->arr);
//     }
//     function orderBy($v1,$v2='asc'){
//       if(is_array($v1) && (!isset($v1['ct']) || $v1['ct'] != $GLOBALS['candy_token_mysql'])){
//         $order = [];
//         foreach($v1 as $key => $val)
//         if(!is_int($key)) $order[] = $this->escape($key,'col').(strtolower($val) == 'desc' ? ' DESC' : ' ASC');
//         else $order[] = $this->escape($val,'col').' ASC';
//         $this->arr['order by'] = implode(',',$order);
//       }else $this->arr['order by'] = $this->escape($v1,'col').(strtolower($v2) == 'desc' ? ' DESC' : ' ASC');
//       return new static($this->table,$this->arr);
//     }
//     function groupBy(){
//       $this->arr['group by'] = isset($this->arr['group by']) ? $this->arr['group by'] : '';
//       $select = array_filter(explode(',',$this->arr['group by']));
//       if(count(func_get_args())==1 && is_array(func_get_args()[0])){
//         if(isset(func_get_args()[0]['ct']) && isset(func_get_args()[0]['v']) && func_get_args()[0]['ct'] == $GLOBALS['candy_token_mysql']){
//           $select[] = func_get_args()[0]['v'];
//         }else{
//           foreach(func_get_args()[0] as $key => $value){
//             $select[] = $this->escape($value,'col');
//           }
//         }
//       }else foreach(func_get_args() as $key) $select[] = $this->escape($key,'col');
//       $this->arr['group by'] = implode(', ',$select);
//       return new static($this->table,$this->arr);
//     }
//     function limit($v1,$v2=null){
//       $this->arr['limit'] = $v2===null ? $v1 : "$v1, $v2";
//       return new static($this->table,$this->arr);
//     }
//     function leftJoin($tb,$col1,$st=null,$col2=null){
//       return $this->join($tb,$col1,$st,$col2,'left join');
//     }
//     function rightJoin($tb,$col1,$st=null,$col2=null){
//       return $this->join($tb,$col1,$st,$col2,'right join');
//     }
//     function join($tb,$col1,$st=null,$col2=null,$type='inner join'){
//       $this->arr[$type] = isset($this->arr[$type]) ? $this->arr[$type] : [];
//       $this->define(is_array($tb) ? array_keys($tb)[0] : $tb);
//       $tb = $this->escape($tb,'table');
//       if($st===null && $col2===null){
//         $col1 = self::whereExtract($col1);
//         $col2 = '';
//         $state = '';
//       }else{
//         $col1 = $this->escape($col1,'col');
//         $col2 = $this->escape(($col2 !== null ? $col2 : $st),'col');
//         $state = $this->escape(($col2 !== null ? $st : '='),'st');
//       }
//       $this->arr[$type][] = $tb . ' ON ' . $col1 . $state . $col2;
//       return new static($this->table,$this->arr);
//     }
//     function login($tb_token = 'candy_token', $key = 'id'){
//       $sql = $this->first();
//       if($sql === false) return false;
//       return new static($this->table,$this->arr);
//     }

  whereExtract(arr){
    let q = "";
    let loop = 1;
    let in_arr = false;
    let state = '=';
    let last = 0;
    for (const key of arr) {
      if(Array.isArray(key) && (state != 'IN' && state != 'NOT IN') && !typeof key.raw !== 'function'){
        q += $last == 1 ? ' AND ' + this.whereExtract(key) : this.whereExtract(key);
        in_arr = true;
        last = 1;
      }else if(arr.length == 2 && loop == 2){
        if(typeof key !== 'array' && this.statements.includes(key.toUpperCase())){
          q += " " + key.toUpperCase();
        }else{
          q += " =" + this.escape(key);
        }
      }else if(in_arr){
        $q += key.toUpperCase() == 'OR' ? " OR " : " AND ";
        last = 2;
      }else if(arr.length == 3 && loop == 2){
        state = this.statements.includes(key.toUpperCase()) ? key.toUpperCase() : "=";
        q += " " + state;
        last = 1;
      }else if(key === null){
        q += " NULL ";
      }else{
        q += ' '+this.escape(key,(loop==1 ? 'table' : 'value'))+' ';
        last = 1;
      }
        loop++;
    }
    return `(${q})`;
  }

  valuesExtract(arr){
    let query_key = [];
    let query_val = [];
    let multiple = false;
    let keys = Object.keys(arr);
    for(let i=0;i<keys.length;i++){
      let key = keys[i];
      let val = arr[key];
  //     if(is_object($val)) $val = (array)$val;
  //     if(is_array($val) && !isset($this->table[$this->arr['table']]['columns'][$key]) && (!isset($val['ct']) || $val['ct']!=$GLOBALS['candy_token_mysql'])){
  //       $multiple = true;
  //       $ex = $this->valuesExtract($val);
  //       $query_key = $ex['into'];
  //       $query_val[] = $ex['values'];
  /*     }else */if(val === null){
        query_key.push(this.escape(key,'col'));
        query_val.push('NULL');
      }else{
        query_key.push(this.escape(key,'col'));
        query_val.push(this.escape(this.type(key,val,'encode')));
      }
    }
    return {
      'into'  : !multiple ? `(${query_key.join(',')})` : query_key,
      'values': !multiple ? `(${query_val.join(',')})` : query_val.join(',')
    };
  }

  escape(v, type){
    if(!type) type = 'value';
    if(v && v.raw && typeof v.raw == 'function') return ' ' + v.raw() + ' ';
    if(type == 'value'){
      if(v === null) return 'NULL';
  //     if(is_array($v)) return ' ("'.implode('","',array_map(function($val){return(Mysql::escape($val));},$v)).'") ';
      return ` ${mysql.escape(v)} `;
    }else if(type == 'table'){
      let as = "";
  //     if(is_array($v)){
  //       $as = array_values($v)[0];
  //       $v = array_keys($v)[0];
  //       $as = " `$as` ";
  //     }
  //     if(strpos($v,'.') !== false) return ' `'.implode('`.`',array_map(function($val){return(Mysql::escape($val));},explode('.',$v))).'` '.$as;
      return ' `' + mysql.escape(v).replace(/'/g, "") + '` ' + as;
    }else if(type == 'col'){
      let as = "";
      if(Array.isArray(v)){
  //       $as = array_values($v)[0];
  //       $v = array_keys($v)[0];
  //       $as = "AS \"$as\" ";
      }
  //     if(strpos($v,'.') !== false) return ' `'.implode('`.`',array_map(function($val){return(Mysql::escape($val));},explode('.',$v))).'` '.$as;
      return ' `' + mysql.escape(v).replace(/'/g, "") + '` ' + as;
    }else if(type == 'statement' || type == 'st'){
      return this.statements.includes(v.toUpperCase()) ? v.toUpperCase() : "=";
    }
  }

//     private function clearcache(){
//       if(!isset($this->arr['table'])) return false;
//       $md5_table = md5($this->arr['table']);
//       $file = "storage/cache/mysql/".md5(Mysql::$name)."/$md5_table*";
//       foreach(glob($file) as $key) unlink($key);
//       return true;
//     }
//     private function error($sql=null){
//       $bt = debug_backtrace();
//       $caller = $bt[1];
//       if(Candy::isDev() && defined('DEV_ERRORS')) printf("Candy Mysql Error: %s\n<br />".$caller['file'].' : '.$caller['line'], mysqli_error(Mysql::$conn));
//       else Config::errorReport('MYSQL',mysqli_error(Mysql::$conn),$caller['file'],$caller['line'],$this->query);
//       return false;
//     }

  define(table){
    if(!Candy.Config.mysql.db) Candy.Config.mysql.db = {};
    if(!Candy.Config.mysql.db[Candy.Mysql.name ?? 'default']) Candy.Config.mysql.db[Candy.Mysql.name ?? 'default'] = {};
    this.table[table] = Candy.Config.mysql.db[Candy.Mysql.name ?? 'default'][table];
    if(this.table[table]) return reject();
    let columns = [];
    return new Promise((resolve, reject) => {
      console.log(`SHOW COLUMNS FROM ${this.escape(table,'table')}`);
      this.conn.query(`SHOW COLUMNS FROM ${this.escape(table,'table')}`, (err, result) => {
        console.log(result);
        console.log(err);
        console.log('anandan başlicam')
        if(err) return reject(err);
        for(let get of result){
          columns[get.Field] = get;
          if(get.Key == 'PRI') this.table[table].primary = get.Field;
        }
        this.table[table].columns = columns;
        Candy.Config.mysql.db[Candy.Mysql.name ?? 'default'][table] = this.table[table];
        this.table[table] = {time: Date.now()};
        return resolve();
      });
    });
  }

  type(col, value, action = 'decode'){
    // if($this->types ?? false) $this->types = [];
    // if(!isset($this->types[$col])) {
    //   $this->types[$col] = 'string';
    //   foreach($this->table as $key => $table){
    //     if(!isset($this->arr['select']) && isset($this->table[$key]['columns'][$col]['Type'])){
    //       $this->types[$col] = $this->table[$key]['columns'][$col]['Type'] ?? $this->types[$col];
    //       break;
    //     } else if(!isset($this->arr['select'])){
    //       continue;
    //     } else if(Candy::var($this->arr['select'])->contains(" AS \"$col\"")){
    //       $exp = explode(' ,',explode(" AS \"$col\"",$this->arr['select'])[0]);
    //       $real_col = explode('.',Candy::var(trim(end($exp)))->clear('`'));
    //       $real_table = trim($real_col[0]);
    //       $real_col = trim($real_col[1]);
    //       $this->types[$col] = $this->types[$col] = $this->table[$real_table]['columns'][$real_col]['Type'] ?? $this->types[$col];
    //       break;
    //     } else if(Candy::var($this->arr['select'])->containsAny(" `$col`", " `".$key."`.`$col`")){
    //       $this->types[$col] = $table['columns'][$col]['Type'] ?? $this->types[$col];
    //     }
    //   }
    // }
    if(action == 'decode'){
    //       if(Candy::var($this->types[$col])->isBegin('tinyint(1)')) $value = boolval($value);
    //   elseif(Candy::var($this->types[$col])->contains('int'))       $value = intval($value);
    //   elseif(Candy::var($this->types[$col])->isBegin('double'))     $value = doubleval($value);
    //   elseif(Candy::var($this->types[$col])->isBegin('float'))      $value = floatval($value);
    //   elseif(Candy::var($this->types[$col])->isBegin('boolean'))    $value = boolval($value);
    //   elseif(Candy::var($this->types[$col])->isBegin('json'))       $value = json_decode($value);
    // } else if(!is_string($value) && (!is_array($value) || ($value['ct'] ?? 0) != $GLOBALS['candy_token_mysql'])) {
    //       if(Candy::var($this->types[$col])->isBegin('tinyint(1)')) $value = intval($value);
    //   elseif(Candy::var($this->types[$col])->isBegin('boolean'))    $value = intval($value);
    //   elseif(Candy::var($this->types[$col])->isBegin('json'))       $value = json_encode($value);
    }
    return value;
  }
}

module.exports = {
  conn: {},
  init: function(){
    if(Candy.Config?.mysql){
        let db = Candy.Config.mysql;
        Candy.Mysql.conn[db.name ?? 'default'] = mysql.createConnection({
            host: db.host ?? "localhost",
            user: db.username,
            password: db.password,
            database: db.database
        });
        Candy.Mysql.conn[db.name ?? 'default'].connect();
    }
  },
  table: function(name){
    return new Table(name, Candy.Mysql.conn['default']);
  },
  raw: function(query){
    return new Raw(query);
  }
};
