package cl.twk.proyectos.repository;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import cl.twk.proyectos.model.User;

@Repository
public interface IUserRepo extends CrudRepository<User, Long> {
	User findByUsername(String username);
}