class XVue {
  constructor(options) {
    this.$data = options.data;
    this.$options = options;
    this.observe(this.$data);
    // new Watcher();
    new Compile(options.el, this);
  }
  observe(value) {
    if (!value || typeof value !== "object") {
      return;
    }
    // 遍历data中的属性
    Object.keys(value).forEach(key => {
      // 为每一个属性定义响应式
      this.createReactive(value, key, value[key]);
      this.proxyData(key);
    });
  }
  createReactive(obj, key, value) {
    //   递归查找嵌套属性定义响应式
    this.observe(value);
    const dep = new Dep();
    Object.defineProperty(obj, key, {
      configurable: true, // 是否可删除修改
      enumerable: true, // 是否可以循环
      get() {
        Dep.target && dep.addDep(Dep.target);
        return value;
      },
      set(newValue) {
        if (value === newValue) {
          return;
        }
        value = newValue;
        dep.notify();
      }
    });
  }
  proxyData(key) {
    Object.defineProperty(this, key, {
      get() {
        return this.$data[key];
      },
      set(newValue) {
        this.$data[key] = newValue;
      }
    });
  }
}

// 收集依赖
class Dep {
  constructor() {
    this.deps = [];
  }
  addDep(dep) {
    this.deps.push(dep);
  }
  notify() {
    this.deps.forEach(dep => {
      dep.update();
    });
  }
}

// 观察者
class Watcher {
  constructor(vm, key, cb) {
    this.vm = vm;
    this.key = key;
    this.cb = cb;
    Dep.target = this;
    this.vm[this.key];
    Dep.target = null;
  }
  update() {
    this.cb.call(this.vm, this.vm[this.key]);
  }
}
