#include "n_layout_prop_edit.h"
#include "ui_n_layout_prop_edit.h"
#include "n_json.h"

#include <QDebug>

const QString NLayoutPropEdit::ClassView = "Navy.View.View";
const QString NLayoutPropEdit::ClassText = "Navy.View.Text";
const QString NLayoutPropEdit::ClassImage = "Navy.View.Image";
const QString NLayoutPropEdit::ClassViewGroup = "Navy.ViewGroup.ViewGroup";

NLayoutPropEdit::NLayoutPropEdit(QWidget *parent) : QWidget(parent), ui(new Ui::NLayoutPropEdit)
{
    ui->setupUi(this);

    hideAllExtraPropWidget();

    connectWidgetToJson();
}

void NLayoutPropEdit::connectWidgetToJson() {
    connect(ui->posXSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->posYSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->sizeWidthSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->sizeHeightSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
}

void NLayoutPropEdit::disconnectWidgetToJson() {
    disconnect(ui->posXSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    disconnect(ui->posYSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    disconnect(ui->sizeWidthSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    disconnect(ui->sizeHeightSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
}

void NLayoutPropEdit::hideAllExtraPropWidget() {
    ui->imageViewWidget->hide();
    ui->textViewWidget->hide();
    ui->viewGroupWidget->hide();
}

void NLayoutPropEdit::showExtraPropWidget(QString className) {
    if (className == ClassView) {
        return;
    } else if (className == ClassImage) {
        ui->imageViewWidget->show();
    } else if (className == ClassText) {
        ui->textViewWidget->show();
    } else if (className == ClassViewGroup) {
        ui->viewGroupWidget->show();
    }
}

void NLayoutPropEdit::setNativeBridge(NativeBridge *native) {
    mNative = native;
    connect(mNative, SIGNAL(currentViewFromJS(NJson)), this, SLOT(setViewFromJS(NJson)));
}

void NLayoutPropEdit::setViewFromJS(const NJson &view) {
    disconnectWidgetToJson();

    mView = view;
    ui->idLabel->setText(view.getStr("id"));
    ui->classLabel->setText(view.getStr("class"));
    ui->posXSpinBox->setValue(view.getInt("pos.x"));
    ui->posYSpinBox->setValue(view.getInt("pos.y"));
    ui->sizeWidthSpinBox->setValue(view.getInt("size.width"));
    ui->sizeHeightSpinBox->setValue(view.getInt("size.height"));



    QString className = view.getStr("class");
    if (className == ClassView) {
       // nothing
    } else if (className == ClassText){
        ui->extraText->setText(view.getStr("extra.text"));
    } else if (className == ClassImage) {
        ui->extraSrc->setText(view.getStr("extra.src"));
    } else if (className == ClassViewGroup) {
        ui->extraContentLayout->setText(view.getStr("extra.contentLayoutFile"));
    }




    hideAllExtraPropWidget();
    showExtraPropWidget(view.getStr("class"));

    connectWidgetToJson();
}

void NLayoutPropEdit::syncWidgetToJson() {
    mView.set("pos.x", ui->posXSpinBox->value());
    mView.set("pos.y", ui->posYSpinBox->value());
    mView.set("size.width", ui->sizeWidthSpinBox->value());
    mView.set("size.height", ui->sizeHeightSpinBox->value());

    emit mNative->changedViewPropertyToJS(mView.toVariant());
}

NLayoutPropEdit::~NLayoutPropEdit()
{
    delete ui;
}
