<template>
  <div class="home">
    
    <gospace  />
  </div>
</template>

<script>
// @ is an alias to /src
// import HelloWorld from '@/components/HelloWorld.vue'
import gospace from '@/components/gospace.vue'

export default {
  name: 'Home',
  components: {
    gospace,
  }
}
</script>
