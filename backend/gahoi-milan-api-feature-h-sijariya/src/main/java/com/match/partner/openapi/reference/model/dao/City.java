package com.match.partner.openapi.reference.model.dao;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "city")
@Data
public class City {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "state_id", nullable = false)
    private Integer stateId;

    @Column(nullable = false, length = 64)
    private String name;

    /** 1 = metro, 2 = large non-metro, 3 = district city. Used for search ranking. */
    @Column(nullable = false)
    private Integer tier;
}
