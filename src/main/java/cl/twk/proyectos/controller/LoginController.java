package cl.twk.proyectos.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class LoginController {
	
	@GetMapping(value = "/index")
	public String index(Model model) {
		return "index";
	}
	
	@GetMapping(value = "login")
	public String login() {
		return "login";
	}
	
	@GetMapping(value = "logout")
	public String logout() {
		return "login";
	}
}
	