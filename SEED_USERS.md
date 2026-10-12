# Pre-registered Users

Seeded demo accounts for local development. All passwords are shared per role.

## Super Admin

| Name | Email | Password |
|------|-------|----------|
| Samuel Adeyemi (EHA) | `admin@emeraldheightacademy.com` | `Admin@1234` |

## Tutors

| Name | Email | Password |
|------|-------|----------|
| Adebayo Ogundele | `tutor.adebayo@emeraldheightacademy.com` | `Tutor@1234` |
| Chidinma Okafor | `tutor.chidinma@emeraldheightacademy.com` | `Tutor@1234` |
| Yusuf Bello | `tutor.yusuf@emeraldheightacademy.com` | `Tutor@1234` |

## Students (25)

All students use password `Student@1234`. Email format: `firstname.lastname@emeraldheightacademy.com`.

| Name | Email |
|------|-------|
| Aisha Bello | `aisha.bello@emeraldheightacademy.com` |
| Tunde Adeleke | `tunde.adeleke@emeraldheightacademy.com` |
| Ngozi Eze | `ngozi.eze@emeraldheightacademy.com` |
| Ibrahim Sani | `ibrahim.sani@emeraldheightacademy.com` |
| Folake Adeniyi | `folake.adeniyi@emeraldheightacademy.com` |
| Emeka Nwachukwu | `emeka.nwachukwu@emeraldheightacademy.com` |
| Amina Yakubu | `amina.yakubu@emeraldheightacademy.com` |
| Segun Ogunleye | `segun.ogunleye@emeraldheightacademy.com` |
| Blessing Uche | `blessing.uche@emeraldheightacademy.com` |
| Musa Danjuma | `musa.danjuma@emeraldheightacademy.com` |
| Chiamaka Obi | `chiamaka.obi@emeraldheightacademy.com` |
| Kelechi Anyanwu | `kelechi.anyanwu@emeraldheightacademy.com` |
| Zainab Lawal | `zainab.lawal@emeraldheightacademy.com` |
| Oluwaseun Ajayi | `oluwaseun.ajayi@emeraldheightacademy.com` |
| Halima Abubakar | `halima.abubakar@emeraldheightacademy.com` |
| Chidi Okonkwo | `chidi.okonkwo@emeraldheightacademy.com` |
| Fatima Bello | `fatima.bello@emeraldheightacademy.com` |
| Tobi Alabi | `tobi.alabi@emeraldheightacademy.com` |
| Amara Nnadi | `amara.nnadi@emeraldheightacademy.com` |
| Sadiq Aliyu | `sadiq.aliyu@emeraldheightacademy.com` |
| Grace Uduak | `grace.uduak@emeraldheightacademy.com` |
| Damilola Bakare | `damilola.bakare@emeraldheightacademy.com` |
| Peter Gyang | `peter.gyang@emeraldheightacademy.com` |
| Maryam Idris | `maryam.idris@emeraldheightacademy.com` |
| Ifeanyi Obiora | `ifeanyi.obiora@emeraldheightacademy.com` |

## Re-seeding

```bash
npm run db:seed
```

This wipes and re-creates all demo data (users, courses, batches, enrollments, attendance, tests, CMS content). Passwords above are always restored.
