class Compile {
  constructor(el, vm) {
    this.$el = document.querySelector(el);
    this.$vm = vm;
    if (this.$el) {
      this.$fragment = this.node2Fragment(this.$el);
      this.compile(this.$fragment);
      this.$el.appendChild(this.$fragment);
    }
  }
  //   将html转化为fragment片段，提交效率
  node2Fragment(el) {
    const fragment = document.createDocumentFragment();
    let child = el.firstChild;
    while ((child = el.firstChild)) {
      fragment.appendChild(child);
    }
    return fragment;
  }
  compile(el) {
    // 遍历所有的子节点
    Array.from(el.childNodes).forEach(node => {
      // 元素节点
      if (this.isElementNode(node)) {
        this.compileElement(node);
        // 文本节点 && {{xxx}}
      } else if (
        this.isTextNode(node) &&
        /\{\{(.*)\}\}/.test(node.textContent)
      ) {
        this.compileText(node, RegExp.$1);
      }
      //   递归编译子节点
      if (node.childNodes && node.childNodes.length) {
        this.compile(node);
      }
    });
  }
  compileElement(node) {
    Array.from(node.attributes).forEach(attr => {
      const attrName = attr.name;
      const exp = attr.value;
      if (this.isDirective(attrName)) {
        const dir = attrName.substr(2);
        this[dir] && this[dir](node, this.$vm, exp);
      } else if (this.isEventDirective(attrName)) {
        const dir = attrName.substr(1);
        this.eventHandler(node, this.$vm, exp, dir);
      }
    });
  }
  compileText(node, exp) {
    this.text(node, this.$vm, exp);
  }
  isElementNode(node) {
    return node.nodeType === 1;
  }
  isTextNode(node) {
    return node.nodeType === 3;
  }
  isDirective(attr) {
    return attr.indexOf("x-") === 0;
  }
  isEventDirective(attr) {
    return attr.indexOf("@") === 0;
  }
  text(node, vm, exp) {
    this.update(node, vm, exp, "text");
  }
  html(node, vm, exp) {
    this.update(node, vm, exp, "html");
  }
  model(node, vm, exp) {
    this.update(node, vm, exp, "model");
    node.addEventListener("input", function(e) {
      vm[exp] = e.target.value;
    });
  }
  update(node, vm, exp, dir) {
    const updaterFn = this[dir + "Updater"];
    updaterFn && updaterFn(node, vm[exp]);
    new Watcher(vm, exp, function() {
      updaterFn && updaterFn(node, vm[exp]);
    });
  }
  textUpdater(node, value) {
    node.textContent = value;
  }
  htmlUpdater(node, value) {
    node.innerHTML = value;
  }
  modelUpdater(node, value) {
    node.value = value;
  }
  eventHandler(node, vm, exp, dir) {
    const fn = vm.$options.methods && vm.$options.methods[exp];
    if (fn && dir) {
      node.addEventListener(dir, fn.bind(vm));
    }
  }
}
