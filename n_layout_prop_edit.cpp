#include "n_layout_prop_edit.h"
#include "ui_n_layout_prop_edit.h"
#include "n_json.h"

#include <QDebug>

NLayoutPropEdit::NLayoutPropEdit(QWidget *parent) : QWidget(parent), ui(new Ui::NLayoutPropEdit)
{
    ui->setupUi(this);

    connect(ui->posXSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->posYSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->sizeWidthSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->sizeHeightSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
}

void NLayoutPropEdit::setNativeBridge(NativeBridge *native) {
    mNative = native;
    connect(native, SIGNAL(currentViewFromJS(NJson)), this, SLOT(setJsonOfView(NJson)));
}

void NLayoutPropEdit::setJsonOfView(const NJson &json) {
    mJson = json;
    ui->idLabel->setText(json.getStr("id"));
    ui->classLabel->setText(json.getStr("class"));
    ui->posXSpinBox->setValue(json.getInt("pos.x"));
    ui->posYSpinBox->setValue(json.getInt("pos.y"));
    ui->sizeWidthSpinBox->setValue(json.getInt("size.width"));
    ui->sizeHeightSpinBox->setValue(json.getInt("size.height"));
}

void NLayoutPropEdit::syncWidgetToJson() {
    mJson.set("pos.x", ui->posXSpinBox->value());
    mJson.set("pos.y", ui->posYSpinBox->value());
    mJson.set("size.width", ui->sizeWidthSpinBox->value());
    mJson.set("size.height", ui->sizeHeightSpinBox->value());

    emit mNative->updatePropertyToJS(mJson.toVariant());
}

NLayoutPropEdit::~NLayoutPropEdit()
{
    delete ui;
}
