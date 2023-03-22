<template>
  <div :class="formatClass">
    <router-view></router-view>
  </div>
</template>

<script>
import { isMobileOnly } from "mobile-device-detect";
export default {
  name: "Content",
  data: function () {
    return {
      formatClass: "wallpaper",
    };
  },
  methods: {
    getMainClass() {
      if (isMobileOnly) this.formatClass = "content mobileBgn";
      else this.formatClass = "content desktopBgn";
    },
  },
  created() {
    this.getMainClass();
  },
};
</script>

<style>
.content {
  grid-area: content;
  background-color: #efefef;
  padding: 20px;

  height: 100%;
  /* Center and scale the image nicely */
  background-attachment: fixed;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}
.desktopBgn {
  background-image: url("/wallpaper.jpg");
}
.mobileBgn {
  background-image: url("/wallpaperMbl.jpg");
}
</style>
