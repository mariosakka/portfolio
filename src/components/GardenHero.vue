<script setup>
import { Vine, Bloom, Cornflower, Bud, Leaf } from '../garden'

const main = 'M-20 540 C40 470 120 450 110 380 S40 300 90 240 S170 190 150 120 S120 40 150 -10'
</script>

<template>
  <div
    aria-hidden="true"
    class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem] overflow-x-clip"
  >
    <div class="absolute left-0 top-0 hidden w-44 opacity-70 lg:block">
      <Vine
        :path="main"
        view-box="-20 -10 280 560"
        :duration="3200"
      >
        <Leaf
          :x="112"
          :y="378"
          :rotate="-25"
          :delay="800"
        />
        <Leaf
          :x="98"
          :y="238"
          :rotate="-35"
          :delay="1600"
        />
        <Leaf
          :x="40"
          :y="470"
          :rotate="-20"
          :delay="400"
        />
        <Bloom
          :x="200"
          :y="330"
          :size="1.15"
          :delay="1400"
        />
        <Bloom
          :x="40"
          :y="190"
          :size="0.8"
          :delay="2000"
        />
        <Bloom
          :x="230"
          :y="90"
          :size="0.7"
          :delay="2600"
        />
        <Cornflower
          :x="190"
          :y="470"
          :size="1.3"
          :delay="1000"
        />
        <Cornflower
          :x="120"
          :y="40"
          :size="0.9"
          :delay="2800"
        />
        <Bud
          :x="168"
          :y="392"
          :rotate="40"
          :delay="1800"
        />
        <Bud
          :x="190"
          :y="52"
          :rotate="35"
          :size="0.8"
          :delay="3000"
        />
      </Vine>
    </div>
    <div class="absolute bottom-0 right-0 hidden w-32 opacity-70 xl:block">
      <Vine
        path="M920 540 C860 500 870 450 820 430 S790 400 800 380"
        view-box="780 360 160 190"
      >
        <Leaf
          :x="850"
          :y="462"
          :rotate="-160"
          :size="0.9"
          :delay="800"
        />
        <Bloom
          :x="800"
          :y="380"
          :size="0.6"
          :rotate="15"
          :delay="1600"
        />
      </Vine>
    </div>
  </div>
</template>
