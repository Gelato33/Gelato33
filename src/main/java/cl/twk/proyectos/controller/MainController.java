package cl.twk.proyectos.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MainController {

	@GetMapping(value = "/media")
	public String media() {
		return "media";
	}

	@GetMapping(value = "/imagenes")
	public String imagenes() {
		return "imagenes";
	}

	@GetMapping(value = "/descargas")
	public String descargas() {
		return "descargas";
	}
}