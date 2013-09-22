#include "n_layout_prop_edit.h"
#include "ui_n_layout_prop_edit.h"
#include "n_json.h"

#include <QDebug>

NLayoutPropEdit::NLayoutPropEdit(QWidget *parent) : QWidget(parent), ui(new Ui::NLayoutPropEdit)
{
    ui->setupUi(this);

    hideAllExtraPropWidget();

    connect(ui->posXSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->posYSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->sizeWidthSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->sizeHeightSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
}

void NLayoutPropEdit::hideAllExtraPropWidget() {
    ui->imageViewWidget->hide();
    ui->textViewWidget->hide();
    ui->viewGroupWidget->hide();
}

void NLayoutPropEdit::showExtraPropWidget(QString className) {
    if (className == "Navy.View.View") {
        return;
    } else if (className == "Navy.View.Image") {
        ui->imageViewWidget->show();
    } else if (className == "Navy.View.Text") {
        ui->textViewWidget->show();
    } else if (className == "Navy.ViewGroup.ViewGroup") {
        ui->viewGroupWidget->show();
    }
}

void NLayoutPropEdit::setNativeBridge(NativeBridge *native) {
    mNative = native;
    connect(mNative, SIGNAL(currentViewFromJS(NJson)), this, SLOT(setViewFromJS(NJson)));
}

void NLayoutPropEdit::setViewFromJS(const NJson &view) {
    mView = view;
    ui->idLabel->setText(view.getStr("id"));
    ui->classLabel->setText(view.getStr("class"));
    ui->posXSpinBox->setValue(view.getInt("pos.x"));
    ui->posYSpinBox->setValue(view.getInt("pos.y"));
    ui->sizeWidthSpinBox->setValue(view.getInt("size.width"));
    ui->sizeHeightSpinBox->setValue(view.getInt("size.height"));

    hideAllExtraPropWidget();
    showExtraPropWidget(view.getStr("class"));
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
