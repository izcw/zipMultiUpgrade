<template>
    <div class="box">
        <el-button @click="showUpgradePopup = true" type="primary">打开进行更新</el-button>
        <div class="Upgrade-popup" v-if="showUpgradePopup">
            <div class="head">
                <p class="title">Upgrade Package</p>
                <div class="close" @click="showUpgradePopup = false"></div>
            </div>
            <div style="height: calc(100% - 41px);">
                <upgradePackage :CurrentVersion="CurrentVersion" />
            </div>
        </div>
    </div>
</template>
<script setup>
import { ref } from 'vue'
import upgradePackage from './upgradePackage/index.vue'


// 系统版本，用于匹配压缩包列表版本
const CurrentVersion = ref([
    { suffix: 'BIN', namingformat: 'SWITCH', version: '1.1.0' },
    { suffix: 'APP', namingformat: 'MCU', version: '1.1.4' },
    { suffix: 'BIN', namingformat: 'EDID', version: '' }    // 无版本
])

const showUpgradePopup = ref(false)

</script>
<style scoped lang='scss'>
.box {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #202126;
}

.Upgrade-popup {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    margin: auto 3rem;

    width: 620px;
    height: auto;
    max-height: 700px;
    background-color: black;
    border-radius: 6px;
    border: 10px solid #000;

    animation: identifier 0.3s ease-in-out;


    .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 0 10px 0;
        box-sizing: border-box;

        .title {
            color: white;
        }

        .close {
            position: relative;
            display: inline-block;
            width: 17px;
            height: 17px;
            cursor: pointer;

            &::before,
            &::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 0;
                width: 100%;
                height: 2px;
                background-color: #fcfcfc;
                transform: translateY(-50%);
            }

            &::before {
                transform: rotate(45deg);
            }

            &::after {
                transform: rotate(-45deg);
            }
        }
    }

    &::after {
        display: block;
        content: "";
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        // -webkit-backdrop-filter: blur(20px);
        // backdrop-filter: blur(20px);
        z-index: -1;
    }
}

@keyframes identifier {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }

}
</style>
