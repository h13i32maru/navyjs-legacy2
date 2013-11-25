#include "n_layout_prop_edit.h"
#include "ui_n_layout_prop_edit.h"
#include "util/n_json.h"
#include "util/n_util.h"
#include "n_project.h"
#include <extend/n_completer.h>

#include <QCompleter>
#include <QDebug>
#include <QListView>
#include <QSortFilterProxyModel>

const QString NLayoutPropEdit::ClassView = "Navy.View.View";
const QString NLayoutPropEdit::ClassText = "Navy.View.Text";
const QString NLayoutPropEdit::ClassImage = "Navy.View.Image";
const QString NLayoutPropEdit::ClassViewGroup = "Navy.ViewGroup.ViewGroup";
const QString NLayoutPropEdit::ClassButton = "Navy.ViewGroup.Button";

NLayoutPropEdit::NLayoutPropEdit(QWidget *parent) : QWidget(parent), ui(new Ui::NLayoutPropEdit)
{
    ui->setupUi(this);

    mWidgetSignalBlocked = false;
    mWidgetList = NUtil::recursiveWidgetChildren(ui->scrollArea);

    refreshForActive();

    hideAllExtraPropWidget();

    connectWidgetToJson();
}

void NLayoutPropEdit::refreshForActive() {
    QStringList images = NProject::instance()->images();
    ui->extraSrc->setList(images);
    ui->extraContentLayout->setList(NProject::instance()->layouts());
    ui->extraNormalSrc->setList(images);
    ui->extraActiveSrc->setList(images);
    ui->extraDisabledSrc->setList(images);
}

void NLayoutPropEdit::setNativeBridge(NativeBridge *native) {
    mNative = native;

    connect(mNative, SIGNAL(selectedViewsFromJS(NJson)), this, SLOT(setSelectedViewsFromJS(NJson)));
    connect(mNative, SIGNAL(currentViewPosFromJS(int,int)), this, SLOT(setViewPosFromJS(int,int)));
    connect(mNative, SIGNAL(currentViewSizeFromJS(int,int)), this, SLOT(setViewSizeFromJS(int,int)));
}

void NLayoutPropEdit::blockAllSignals(bool block) {
    if (block == mWidgetSignalBlocked) {
        return;
    }

    mWidgetSignalBlocked = block;
    int len = mWidgetList.length();
    for (int i = 0; i < len; i++) {
        mWidgetList[i]->blockSignals(block);
    }
}

void NLayoutPropEdit::connectWidgetToJson() {
    connect(ui->visible, SIGNAL(toggled(bool)), this, SLOT(syncWidgetToJson()));
    connect(ui->posXSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->posYSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->sizeWidthSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->sizeHeightSpinBox, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->backgroundColor, SIGNAL(textChanged(QString)), this, SLOT(syncWidgetToJson()));
    connect(ui->sizePolicyWidth, SIGNAL(currentIndexChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->sizePolicyHeight, SIGNAL(currentIndexChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->linkType, SIGNAL(currentIndexChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->linkType, SIGNAL(currentIndexChanged(int)), this, SLOT(setLinkIdList()));
    connect(ui->linkId, SIGNAL(currentTextChanged(QString)), this, SLOT(syncWidgetToJson()));

    // text
    connect(ui->extraText, SIGNAL(textChanged(QString)), this, SLOT(syncWidgetToJson()));
    connect(ui->extraFontSize, SIGNAL(valueChanged(int)), this, SLOT(syncWidgetToJson()));
    connect(ui->extraFontColor, SIGNAL(textChanged(QString)), this, SLOT(syncWidgetToJson()));

    // image
    connect(ui->extraSrc, SIGNAL(currentTextChanged(QString)), this, SLOT(syncWidgetToJson()));

    // view group
    connect(ui->extraContentLayout, SIGNAL(currentTextChanged(QString)), this, SLOT(syncWidgetToJson()));

    // button
    connect(ui->extraNormalSrc, SIGNAL(currentTextChanged(QString)), this, SLOT(syncWidgetToJson()));
    connect(ui->extraActiveSrc, SIGNAL(currentTextChanged(QString)), this, SLOT(syncWidgetToJson()));
    connect(ui->extraDisabledSrc, SIGNAL(currentTextChanged(QString)), this, SLOT(syncWidgetToJson()));
}

void NLayoutPropEdit::syncWidgetToJson() {
    mView.set("visible", ui->visible->isChecked());
    mView.set("pos.x", ui->posXSpinBox->value());
    mView.set("pos.y", ui->posYSpinBox->value());
    mView.set("size.width", ui->sizeWidthSpinBox->value());
    mView.set("size.height", ui->sizeHeightSpinBox->value());
    mView.set("backgroundColor", ui->backgroundColor->text());
    mView.set("sizePolicy.width", ui->sizePolicyWidth->currentText());
    mView.set("sizePolicy.height", ui->sizePolicyHeight->currentText());

    if (ui->linkType->currentIndex() != 0) {
        mView.set("link.type", ui->linkType->currentText());
        mView.set("link.id", ui->linkId->currentText());
    } else {
        mView.remove("link");
    }

    QString className = mView.getStr("class");
    if (className == ClassView) {
       // nothing
    } else if (className == ClassText){
        mView.set("extra.text", ui->extraText->text());
        mView.set("extra.fontSize", ui->extraFontSize->value());
        mView.set("extra.fontColor", ui->extraFontColor->text());
    } else if (className == ClassImage) {
        mView.set("extra.src", ui->extraSrc->currentText());
    } else if (className == ClassViewGroup) {
        mView.set("extra.contentLayoutFile", ui->extraContentLayout->currentText());
    } else if (className == ClassButton) {
        mView.set("extra.text", ui->extraText->text());
        mView.set("extra.fontSize", ui->extraFontSize->value());
        mView.set("extra.fontColor", ui->extraFontColor->text());
        mView.set("extra.normal.src", ui->extraNormalSrc->currentText());
        mView.set("extra.active.src", ui->extraActiveSrc->currentText());
        mView.set("extra.disabled.src", ui->extraDisabledSrc->currentText());
    }

//    emit mNative->changedViewPropertyToJS(mView.toVariant());
}

void NLayoutPropEdit::hideAllExtraPropWidget() {
    ui->imageViewWidget->hide();
    ui->textViewWidget->hide();
    ui->viewGroupWidget->hide();
    ui->buttonViewWidget->hide();
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
    } else if (className == ClassButton) {
        ui->textViewWidget->show();
        ui->buttonViewWidget->show();
    }
}

void NLayoutPropEdit::setSelectedViewsFromJS(const NJson &views) {
    blockAllSignals(true);

    // 複数のviewが選択されている場合があるので、最後に選択されたものを対象とする
    QString last = QString::number(views.length() - 1);
    NJson view = views.getObject(last);

    mView = view;
    ui->idLabel->setText(view.getStr("id"));
    ui->classLabel->setText(view.getStr("class"));
    ui->visible->setChecked(view.getBool("visible"));
    ui->posXSpinBox->setValue(view.getInt("pos.x"));
    ui->posYSpinBox->setValue(view.getInt("pos.y"));
    ui->sizeWidthSpinBox->setValue(view.getInt("size.width"));
    ui->sizeHeightSpinBox->setValue(view.getInt("size.height"));
    ui->backgroundColor->setText(view.getStr("backgroundColor"));
    ui->sizePolicyWidth->setCurrentText(view.getStr("sizePolicy.width"));
    ui->sizePolicyHeight->setCurrentText(view.getStr("sizePolicy.height"));

    ui->linkType->setCurrentIndex(0);
    ui->linkType->setCurrentText(view.getStr("link.type"));
    ui->linkId->setCurrentText(view.getStr("link.id"));


    QString className = view.getStr("class");
    if (className == ClassView) {
       // nothing
    } else if (className == ClassText){
        ui->extraText->setText(view.getStr("extra.text"));
        ui->extraFontSize->setValue(view.getInt("extra.fontSize"));
        ui->extraFontColor->setText(view.getStr("extra.fontColor"));
    } else if (className == ClassImage) {
        ui->extraSrc->setCurrentText(view.getStr("extra.src"));
    } else if (className == ClassViewGroup) {
        ui->extraContentLayout->setCurrentText(view.getStr("extra.contentLayoutFile"));
    } else if (className == ClassButton) {
        ui->extraText->setText(view.getStr("extra.text"));
        ui->extraFontSize->setValue(view.getInt("extra.fontSize"));
        ui->extraFontColor->setText(view.getStr("extra.fontColor"));

        ui->extraNormalSrc->setCurrentText(view.getStr("extra.normal.src"));
        ui->extraActiveSrc->setCurrentText(view.getStr("extra.active.src"));
        ui->extraDisabledSrc->setCurrentText(view.getStr("extra.disabled.src"));
    }




    hideAllExtraPropWidget();
    showExtraPropWidget(view.getStr("class"));

    blockAllSignals(false);
}

void NLayoutPropEdit::setViewPosFromJS(const int &x, const int &y) {
    blockAllSignals(true);

    ui->posXSpinBox->setValue(x);
    ui->posYSpinBox->setValue(y);

    blockAllSignals(false);
}

void NLayoutPropEdit::setViewSizeFromJS(const int &width, const int &height) {
    blockAllSignals(true);

    ui->sizeWidthSpinBox->setValue(width);
    ui->sizeHeightSpinBox->setValue(height);

    blockAllSignals(false);
}

void NLayoutPropEdit::setLinkIdList() {
    QString type = ui->linkType->currentText();
    if (type == "page") {
        ui->linkId->setList(NProject::instance()->pages());
    } else if(type == "scene") {
        ui->linkId->setList(NProject::instance()->scenes());
    }
}

NLayoutPropEdit::~NLayoutPropEdit()
{
    delete ui;
}
