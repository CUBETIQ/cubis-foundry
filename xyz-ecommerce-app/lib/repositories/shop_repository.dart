import 'package:shared_preferences/shared_preferences.dart';

import '../data/seed_catalog.dart';
import '../models/commerce_models.dart';

class ShopRepository {
  ShopRepository._(this._prefs);

  static const _stateKey = 'xyz.shop.state.v1';

  final SharedPreferences _prefs;

  static Future<ShopRepository> bootstrap() async {
    final prefs = await SharedPreferences.getInstance();
    return ShopRepository._(prefs);
  }

  List<Product> get products => buildSeedProducts();

  Future<PersistedShopState> loadState() async {
    final raw = _prefs.getString(_stateKey);
    if (raw == null || raw.trim().isEmpty) {
      return PersistedShopState.empty();
    }
    try {
      return PersistedShopState.fromJson(raw);
    } catch (_) {
      return PersistedShopState.empty();
    }
  }

  Future<void> saveState(PersistedShopState state) {
    return _prefs.setString(_stateKey, state.toJson());
  }
}
