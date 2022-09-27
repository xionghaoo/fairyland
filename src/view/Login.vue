<template>
  <div class="login-body b-b-b">
    <div class="login-div">
      <div class="login-logo">
        <img :src="brand.brand_icon" alt=""/>
        <span style="margin-left:10px">{{ brand.brand_name}}客户端</span>
      </div>
      <div class="login-form">
        <el-form label-position="right" :model="loginData" :rules="rules" ref="ruleForm">
          <el-form-item label="" prop="login_name">
            <el-input placeholder="请输入用户名" v-model="loginData.login_name">
              <i slot="prefix" class="el-input__icon el-icon-mobile-phone"></i>
            </el-input>
          </el-form-item>
          <el-form-item label="" prop="password">
            <el-input placeholder="请输入密码" v-model="loginData.password" type="password">
              <i slot="prefix" class="el-input__icon el-icon-edit"></i>
            </el-input>
          </el-form-item>
        </el-form>
        <el-button type="primary" size="large" @click.native="submitLogin" class="btn-submit">登录</el-button>
      </div>
    </div>
    <div class="foot-div"></div>
  </div>
</template>

<script>
import { Form, FormItem, Button, Input } from 'element-ui';
import logo from '@/assets/logo.png'
import Request from "@/utils/request";
import Config from "@/utils/config";

export default {
  name: "Login",
  components: {
    'el-form': Form,
    'el-form-item': FormItem,
    'el-button': Button,
    'el-input': Input,
    // 'el-checkbox': Checkbox
  },
  data() {
    return {
      brand: {
        brand_icon: logo,
        brand_name: '幻境'
      },
      loginData: {
        login_name: '',
        password: '',
      },
      rules: {
        login_name: [
          { required: true, message: '用户名不能为空', trigger: 'change' }
        ],
        password: [
          { required: true, message: '密码不能为空', trigger: 'change' }
        ]
      }
    }
  },
  methods: {
    submitLogin() {
      let _this = this;
      _this.$refs['ruleForm'].validate((valid) => {
        if (valid) {
          let { loginData } = _this;
          Request.requestPost(
              Config.api.login,
              {
                username: this.$data.loginData.login_name,
                password: loginData.password
              }
          ).then((res) => {
            if (res.code === 0) {
              localStorage.setItem('company_id', res.data.company_id)
              _this.$attrs.callback();
              this.$message({
                message: '登陆成功',
                type: 'success'
              });
            } else {
              this.$message({
                message: res.message,
                type: 'error'
              });
            }
          })
        }
      });
    },
  }
}
</script>

<style scoped>
.login-body{
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #2c3e50;
  /*background-image: url('./assets/img/login_bg.jpg');*/
}
.login-div {
  position: absolute;
  width: 450px;
  height: 300px;
  background: #fff;
  top: 50%;
  left: 50%;
  margin: -180px 0 0 -225px;
  box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.2);
}
.login-logo {
  height: 110px;
  margin-left: 50px;
  overflow: hidden;
}
.login-logo > img{
  height: 68px;
  float: left;
  margin: 25px 0 0 0;
}
.login-logo > span{
  float: left;
  font-size: 24px;
  margin-top: 46px;
  color: #32958b;
  font-weight:bold;
}
.login-form {
  margin: 0 50px;
}
.auto-login{
  margin-top: 10px;
}
.btn-submit {
  float: right;
  width: 120px;
}
.foot-div{
  position: absolute;
  bottom: 0px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  width: 100%;
  color: #666;
  font-size: 12px;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
}

</style>