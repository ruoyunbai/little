<template>
  <div id="nav">
    <router-link to="/" @click="disappear">五子棋</router-link> |
    <router-link to="/about">以棋会友</router-link>
  </div>
  <router-view/>
</template>
<script>
export default {
  methods:{
    disappear(){
      if(document.getElementById("readme")!=null){
      document.removeChild(document.getElementById("readme"))
    }
    }
  }
}
</script>
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
body{
  background-color: rgb(254, 214, 148);
}
</style>
