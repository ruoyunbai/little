<template>
  <div class="home">
    
    <gobang  />
  </div>
</template>

<script>
// @ is an alias to /src
// import HelloWorld from '@/components/HelloWorld.vue'
import gobang from '@/components/gobang.vue'

export default {
  name: 'Home',
  components: {
    gobang
  }
}
</script>
