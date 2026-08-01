package com.match.partner.openapi.reference.repository;

import com.match.partner.openapi.reference.model.dao.City;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CityRepository extends JpaRepository<City, Integer> {

    /** Tier first so metros surface above district cities in the picker. */
    List<City> findByStateIdOrderByTierAscNameAsc(Integer stateId);

    List<City> findByTierLessThanEqualOrderByTierAscNameAsc(Integer tier);

    List<City> findByNameContainingIgnoreCaseOrderByTierAscNameAsc(String name);
}
