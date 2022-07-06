const Constant = (() => {
    return {
        ModelType: {
            TEXT: 0,
            SHAPE: 1
        },
        // 后端静态资源路径前缀，这部分需要在资源文件名称中去掉
        RESOURCE_PREFIX: "/static/resources/"
    }
})();

export default Constant