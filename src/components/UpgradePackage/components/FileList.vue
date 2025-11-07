<!-- src\components\UpgradePackage\components\FileList.vue -->
<template>
  <div class="file-list-container">
    <div
      class="file-list"
      :style="{ height: ListHeight + 'px', maxHeight: ListHeight + 'px' }"
    >
      <div
        v-for="(file, index) in files"
        :key="file.name"
        class="file-item"
        :class="{ checked: isChecked(file) }"
        :style="{
          opacity: props.disableLowVersion
            ? file.needUpgrade === false
              ? 0.5
              : 1
            : 1,
        }"
        @click="$emit('toggle-check', file)"
      >
        <input
          class="item-checkbox"
          type="checkbox"
          :checked="isChecked(file)"
          :disabled="
            props.disableLowVersion
              ? file.needUpgrade === false
                ? true
                : false
              : false
          "
          @click.stop
          @change="$emit('toggle-check', file)"
        />
        <span class="item-index">{{ index + 1 }}</span>
        <span class="item-name" :title="file.name">{{
          file.shortName || file.name
        }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  files: { type: Array, default: () => [] },
  checkedFiles: { type: Array, default: () => [] },
  disableLowVersion: { type: Boolean, default: () => true },
  ListHeight: { type: Number, default: 120 },
});

defineEmits(["toggle-check"]);

const isChecked = (file) => {
  return props.checkedFiles.includes(file);
};
</script>

<style scoped lang="scss">
@use "@/styles/index.scss" as *;

.file-list-container {
  margin: 10px 0;
}

.file-list {
  overflow-y: auto;

  @include mini-scrollbar;
}

.file-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  padding: 4px 8px;
  margin-bottom: 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(204, 204, 204, 0.15);
  }
  &.checked {
    background-color: rgba(204, 204, 204, 0.2);
  }

  > * {
    margin: 3px 6px 3px 0;
    font-size: 14px;

    &:last-child {
      margin-right: 0;
    }
  }
}

.item-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.item-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
