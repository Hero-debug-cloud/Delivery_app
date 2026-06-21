import 'package:flutter_bloc/flutter_bloc.dart';
import '../../data/repositories/address_repository.dart';
import '../../domain/models/customer_address.dart';
import 'address_state.dart';

class AddressCubit extends Cubit<AddressState> {
  final AddressRepository repository;

  AddressCubit(this.repository) : super(const AddressInitial());

  Future<void> loadAddresses() async {
    emit(const AddressLoading());
    try {
      final addresses = await repository.getAddresses();
      emit(AddressLoaded(addresses: addresses));
    } catch (e) {
      emit(AddressError(message: e.toString().replaceFirst('Exception: ', '')));
    }
  }

  Future<void> addAddress(CustomerAddress address) async {
    emit(const AddressLoading());
    try {
      await repository.createAddress(address);
      emit(const AddressActionSuccess(message: 'Address added successfully'));
      await loadAddresses();
    } catch (e) {
      emit(AddressError(message: e.toString().replaceFirst('Exception: ', '')));
    }
  }

  Future<void> updateCustomerAddress(String id, Map<String, dynamic> data) async {
    emit(const AddressLoading());
    try {
      await repository.updateAddress(id, data);
      emit(const AddressActionSuccess(message: 'Address updated successfully'));
      await loadAddresses();
    } catch (e) {
      emit(AddressError(message: e.toString().replaceFirst('Exception: ', '')));
    }
  }

  Future<void> deleteAddress(String id) async {
    emit(const AddressLoading());
    try {
      await repository.deleteAddress(id);
      emit(const AddressActionSuccess(message: 'Address deleted successfully'));
      await loadAddresses();
    } catch (e) {
      emit(AddressError(message: e.toString().replaceFirst('Exception: ', '')));
    }
  }

  Future<void> setAsDefault(CustomerAddress address) async {
    emit(const AddressLoading());
    try {
      await repository.updateAddress(address.id, {'isDefault': true});
      emit(const AddressActionSuccess(message: 'Default address updated'));
      await loadAddresses();
    } catch (e) {
      emit(AddressError(message: e.toString().replaceFirst('Exception: ', '')));
    }
  }
}
