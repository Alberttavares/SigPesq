package com.sigpesq.api.controller;

import com.sigpesq.api.dto.LoginRequest;
import com.sigpesq.api.model.Participante;
import com.sigpesq.api.repository.ParticipanteRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final ParticipanteRepository repository;

    public AuthController(ParticipanteRepository repository) {
        this.repository = repository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        Participante participante = repository.autenticar(request.cpf(), request.senha());

        if (participante == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("CPF ou senha inválidos.");
        }

        return ResponseEntity.ok(participante);
    }
}