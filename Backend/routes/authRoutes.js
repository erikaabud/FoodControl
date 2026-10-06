const express = require("express");
const authController = require("../controllers/authController");
const { autenticar } = require("../middleware/authMidleware");

const router = express.Router();

router.get("/setup-status", authController.setupStatus);
router.post("/primeiro-acesso", authController.primeiroAcesso);
router.post("/login", authController.login);
router.post("/usuarios", autenticar, authController.cadastrarUsuario);
router.get("/me", autenticar, authController.me);

module.exports = router;
