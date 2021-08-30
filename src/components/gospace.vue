<template>
 
  <canvas id="space"></canvas>
  <!-- <button style="position:fixed;">haha</button> -->
 
</template>

<script>
import space from "../space/space.js"
export default {
   
  name: 'gospace',
  mounted(){
        space();
},
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
