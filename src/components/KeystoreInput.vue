<template>
  <FileInput
    @select-file="toSelectKeystoreFile"
    :filename="filename"
    :fileFormat="'text'"
    :accept="'.json'"
    :placeholder="$t('keystoreInput.please_open_wallet_keystore_file')"
  ></FileInput>
</template>

<script>
import FileInput from "./FileInput.vue";
export default {
  name: "KeystoreInput",
  components: { FileInput },
  data() {
    return {
      form: {
        keystoreFileInput: null,
        keystoreFileJson: null
      }
    };
  },
  methods: {
    toSelectKeystoreFile(fileContent, filename) {
      try {
        let fileJson = JSON.parse(fileContent);
        if (!fileJson || !fileJson.address) {
          this.showError("Invalid keystore file");
          return;
        }
        this.form.keystoreFileJson = fileJson;
        this.$emit("select-file", fileJson, filename);
      } catch (e) {
        this.showError(e);
      }
    },
    showError(e) {
      e = utils.getShowErrorMessage(e);
      this.$message({
        showClose: true,
        message: e,
        type: "error"
      });
    }
  },
  props: ["filename"]
};
</script>

<style lang="scss">
</style>
